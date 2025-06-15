"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import RawMaterial from "@/models/RawMaterial";
import { authOptions } from "@/api/auth/[...nextauth]/route";

/**
 * Get all raw materials with pagination and filtering
 */
export async function getRawMaterials({ page = 1, limit = 10, name = null } = {}) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

    // Connect to the database
    await dbConnect();
    
    // Create the query
    const query = {};
    
    // Apply name filter if provided
    if (name) {
      query.name = { $regex: name, $options: "i" }; // Case-insensitive search
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total raw materials for pagination
    const totalItems = await RawMaterial.countDocuments(query);

    // Retrieve raw materials with pagination
    const rawMaterials = await RawMaterial.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by newest first

    return {
      success: true,
      data: rawMaterials,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching raw materials:", error);
    return {
      success: false,
      message: "Failed to fetch raw materials",
      error: error.message,
    };
  }
}

/**
 * Get a single raw material by ID
 */
export async function getRawMaterialById(id) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

    // Connect to the database
    await dbConnect();

    // Find the raw material by ID
    const rawMaterial = await RawMaterial.findById(id);

    if (!rawMaterial) {
      return {
        success: false,
        message: "Raw material not found",
      };
    }

    // Additionally, get the inventory level if needed
    const inventoryLevel = await rawMaterial.getInventoryLevel();

    return {
      success: true,
      data: {
        ...rawMaterial.toJSON(),
        inventoryLevel,
      },
    };
  } catch (error) {
    console.error("Error fetching raw material:", error);
    return {
      success: false,
      message: "Failed to fetch raw material",
      error: error.message,
    };
  }
}

/**
 * Create a new raw material
 */
export async function createRawMaterial(materialData) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

    // Connect to the database
    await dbConnect();

    // Add the user ID who created the raw material
    materialData.created_by = session.user.id;

    // Create a new raw material
    const rawMaterial = await RawMaterial.create(materialData);

    // Revalidate the raw-materials cache
    revalidatePath('/raw-materials');

    return {
      success: true,
      data: rawMaterial,
    };
  } catch (error) {
    console.error("Error creating raw material:", error);
    return {
      success: false,
      message: "Failed to create raw material",
      error: error.message,
    };
  }
}

/**
 * Update an existing raw material
 */
export async function updateRawMaterial(id, materialData) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

    // Connect to the database
    await dbConnect();

    // Find the raw material by ID and update it
    const rawMaterial = await RawMaterial.findByIdAndUpdate(id, materialData, {
      new: true, // Return the updated document
      runValidators: true, // Run mongoose validation
    });

    if (!rawMaterial) {
      return {
        success: false,
        message: "Raw material not found",
      };
    }

    // Revalidate the raw material and raw materials cache
    revalidatePath(`/raw-materials/${id}`);
    revalidatePath('/raw-materials');

    return {
      success: true,
      data: rawMaterial,
    };
  } catch (error) {
    console.error("Error updating raw material:", error);
    return {
      success: false,
      message: "Failed to update raw material",
      error: error.message,
    };
  }
}

/**
 * Delete a raw material
 */
export async function deleteRawMaterial(id) {
  try {
    // Authenticate the user
    const session = await getServerSession(authOptions);
    if (!session) {
      return { 
        success: false, 
        message: "Unauthorized" 
      };
    }

    // Connect to the database
    await dbConnect();

    // Get the raw material before deletion to check if it's in use
    const rawMaterial = await RawMaterial.findById(id);
    
    if (!rawMaterial) {
      return {
        success: false,
        message: "Raw material not found",
      };
    }

    // Check if the raw material is used in any BOM
    const isInUse = await rawMaterial.isInUse();
    
    if (isInUse) {
      return {
        success: false,
        message: "Cannot delete raw material that is in use by BOMs or inventory",
      };
    }

    // Delete the raw material
    await RawMaterial.findByIdAndDelete(id);

    // Revalidate the raw materials cache
    revalidatePath('/raw-materials');

    return {
      success: true,
      message: "Raw material deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting raw material:", error);
    return {
      success: false,
      message: "Failed to delete raw material",
      error: error.message,
    };
  }
}
