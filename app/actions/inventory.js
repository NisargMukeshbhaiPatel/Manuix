"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Inventory from "@/models/Inventory";
import { authOptions } from "@/api/auth/[...nextauth]/route";

/**
 * Get all inventory items with pagination and filtering
 */
export async function getInventoryItems({ page = 1, limit = 10, itemType = null, lowStock = false } = {}) {
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
    
    // Apply item type filter if provided
    if (itemType && ['product', 'raw_material'].includes(itemType)) {
      query.item_type = itemType;
    }

    // Apply low stock filter if requested
    if (lowStock) {
      // Define low stock as items with quantity below threshold (5 for products, 10 for raw materials)
      query.$expr = {
        $lt: [
          "$quantity", 
          { $cond: [{ $eq: ["$item_type", "product"] }, 5, 10] }
        ]
      };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total inventory items for pagination
    const totalItems = await Inventory.countDocuments(query);

    // Retrieve inventory items with pagination and populate references
    const inventoryItems = await Inventory.find(query)
      .populate('item_id')  // The population path is already handled in the schema
      .skip(skip)
      .limit(limit)
      .sort({ last_updated: -1 }); // Sort by most recently updated first

    return {
      success: true,
      data: inventoryItems,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching inventory items:", error);
    return {
      success: false,
      message: "Failed to fetch inventory items",
      error: error.message,
    };
  }
}

/**
 * Get a single inventory item by ID
 */
export async function getInventoryItemById(id) {
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

    // Find the inventory item by ID and populate references
    const inventoryItem = await Inventory.findById(id).populate('item_id');

    if (!inventoryItem) {
      return {
        success: false,
        message: "Inventory item not found",
      };
    }

    return {
      success: true,
      data: inventoryItem,
    };
  } catch (error) {
    console.error("Error fetching inventory item:", error);
    return {
      success: false,
      message: "Failed to fetch inventory item",
      error: error.message,
    };
  }
}

/**
 * Update inventory levels (add, remove, or set quantity)
 */
export async function updateInventory({ itemType, itemId, quantity, operation = 'add' }) {
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

    // Validate required fields
    if (!itemType || !itemId || quantity === undefined) {
      return {
        success: false,
        message: "Missing required fields: itemType, itemId, and quantity are required",
      };
    }
    
    let result;
    
    // If it's a direct update (set to specific value), we find and update
    if (operation === 'set') {
      result = await Inventory.findOneAndUpdate(
        { item_type: itemType, item_id: itemId },
        { 
          quantity: quantity,
          last_updated: new Date(),
          item_type_ref: itemType === 'product' ? 'Product' : 'RawMaterial'
        },
        { new: true, upsert: true }
      );
    } 
    // If it's an adjustment (add/remove quantity), we use the updateStock static method
    else {
      const change = operation === 'remove' ? -parseFloat(quantity) : parseFloat(quantity);
      result = await Inventory.updateStock(
        itemType, 
        itemId, 
        change, 
        { userId: session.user.id }
      );
    }

    // Populate the item reference
    await result.populate('item_id');

    // Revalidate inventory cache
    revalidatePath('/inventory');
    revalidatePath(`/inventory/${result._id}`);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error updating inventory:", error);
    return {
      success: false,
      message: "Failed to update inventory",
      error: error.message,
    };
  }
}

/**
 * Delete an inventory item
 */
export async function deleteInventoryItem(id) {
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

    // Find the inventory item by ID and delete it
    const inventoryItem = await Inventory.findByIdAndDelete(id);

    if (!inventoryItem) {
      return {
        success: false,
        message: "Inventory item not found",
      };
    }

    // Revalidate inventory cache
    revalidatePath('/inventory');

    return {
      success: true,
      message: "Inventory item deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    return {
      success: false,
      message: "Failed to delete inventory item",
      error: error.message,
    };
  }
}
