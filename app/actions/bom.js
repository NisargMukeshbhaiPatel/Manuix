"use server";

import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/db";
import BOM from "@/models/BOM";
import { authOptions } from "@/lib/auth";
import { createCollectionRBAC } from "@/lib/rbac";

const { withCreate, withRead, withUpdate, withDelete } = createCollectionRBAC("boms");
import { updateProduct } from "@/actions/product";

/**
 * Get all BOMs with pagination and filtering
 */
export const getBOMs = withRead(async ({ page = 1, limit = 10, productId = null } = {}) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // Create the query
    const query = {};
    
    // Apply product filter if provided
    if (productId) {
      query.product_id = productId;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total BOMs for pagination
    const totalItems = await BOM.countDocuments(query);

    // Retrieve BOMs with pagination and populated references
    const boms = await BOM.find(query)
      .populate('product_id')
      .populate('created_by', 'name email')
      .populate('items.raw_material_id')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Sort by newest first

    return {
      success: true,
      boms:boms.map((b) => b.toJSON()),
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching BOMs:", error);
    return {
      success: false,
      message: "Failed to fetch BOMs",
      error: error.message,
    };
  }
});

/**
 * Get a single BOM by ID
 */
export const getBOMById = withRead(async (id) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the BOM by ID with populated references
    const bom = await BOM.findById(id)
      .populate('product_id')
      .populate('created_by', 'name email')
      .populate('items.raw_material_id');

    if (!bom) {
      return {
        success: false,
        message: "BOM not found",
      };
    }

    return {
      success: true,
      data: bom.toJSON(),
    };
  } catch (error) {
    console.error("Error fetching BOM:", error);
    return {
      success: false,
      message: "Failed to fetch BOM",
      error: error.message,
    };
  }
});

/**
 * Create a new BOM
 */
export const createBOM = withCreate(async (bomData) => {
  try {
    // Connect to the database
    await dbConnect();
    const session = await getServerSession(authOptions);

    // Add the user ID who created the BOM
    bomData.created_by = session.user.id;

    // Create a new BOM
    const bom = await BOM.create(bomData);
    
    // Populate references for the response
    await bom.populate('product_id');
    await bom.populate('created_by', 'name email');
    await bom.populate('items.raw_material_id');

    return {
      success: true,
      data: bom.toJSON(),
    };
  } catch (error) {
    console.error("Error creating BOM:", error);
    return {
      success: false,
      message: "Failed to create BOM",
      error: error.message,
    };
  }
});

/**
 * Update an existing BOM
 */
export const updateBOM = withUpdate(async (id, bomData, product) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the BOM by ID and update it
    const bom = await BOM.findByIdAndUpdate(id, bomData, {
      new: true, // Return the updated document
      runValidators: true, // Run mongoose validation
    });
    if (product) {
      await updateProduct(product._id, product.data);
    }

    if (!bom) {
      return {
        success: false,
        message: "BOM not found",
      };
    }
    // Populate references for the response
    await bom.populate('product_id');
    await bom.populate('created_by', 'name email');
    await bom.populate('items.raw_material_id');


    return {
      success: true,
      data: bom.toJSON(),
    };
  } catch (error) {
    console.error("Error updating BOM:", error);
    return {
      success: false,
      message: "Failed to update BOM",
      error: error.message,
    };
  }
});

/**
 * Delete a BOM
 */
export const deleteBOM = withDelete(async (id) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // Find the BOM by ID
    const bom = await BOM.findById(id);
    
    if (!bom) {
      return {
        success: false,
        message: "BOM not found",
      };
    }
    
    // Check if the BOM is currently in use
    // (This would depend on your business logic, could check if product is in use)
    
    await bom.deleteOne();
    
    return {
      success: true,
      message: "BOM deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting BOM:", error);
    return {
      success: false,
      message: "Failed to delete BOM",
      error: error.message,
    };
  }
});
