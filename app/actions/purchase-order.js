"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/db";
import PurchaseOrder from "@/models/PurchaseOrder";
import Inventory from "@/models/Inventory";
import { createCollectionRBAC } from "@/lib/rbac";

const { withCreate, withRead, withUpdate, withDelete } = createCollectionRBAC("purchaseorders");

/**
 * Get all purchase orders with pagination and filtering
 */
export const getPurchaseOrders = withRead(async ({ 
  page = 1, 
  limit = 10, 
  status = null,
  supplierId = null,
  startDate = null,
  search = null,
  endDate = null
} = {}) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // Create the query
    const query = {};
    
    // Apply status filter if provided
    if (status) {
      query.status = status;
    }

    // Apply supplier name search if provided
	if (search) {
	  query.supplier_name = {
		$regex: search,
		$options: 'i' // Case-insensitive search
	  };
	}

    // Apply supplier filter if provided
    if (supplierId) {
      query.supplier_id = supplierId;
    }

    // Apply date range filter if provided
    if (startDate || endDate) {
      query.updatedAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.updatedAt.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.updatedAt.$lte = end;
      }
    }


    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total purchase orders for pagination
    const totalItems = await PurchaseOrder.countDocuments(query);

    // Retrieve purchase orders with pagination and populated references
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate('created_by', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ order_date: -1, createdAt: -1 }); // Sort by order date (newest first)

    return {
      success: true,
      data: purchaseOrders.map(po => po.toJSON()),
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return {
      success: false,
      message: "Failed to fetch purchase orders",
      error: error.message,
    };
  }
});

/**
 * Get purchase order statistics
 */
export const getPurchaseOrderStats = withRead(async ({ period = 'month' } = {}) => {
  try {
    // Connect to the database
    await dbConnect();

    // Set the date range based on the period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1); // Default to month
    }

    // Get counts by status
    const statusQuery = [
      { $match: { order_date: { $gte: startDate } } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          total: { $sum: "$total_amount" }
        }
      }
    ];
    
    const statusStats = await PurchaseOrder.aggregate(statusQuery);
    
    // Process into a more usable format
    const stats = {
      draft: { count: 0, total: 0 },
      pending: { count: 0, total: 0 },
      received: { count: 0, total: 0 },
      cancelled: { count: 0, total: 0 },
      completed: { count: 0, total: 0 },
      total_orders: 0,
      total_amount: 0,
      period,
      start_date: startDate,
      end_date: now
    };
    
    statusStats.forEach(stat => {
      if (stats[stat._id]) {
        stats[stat._id].count = stat.count;
        stats[stat._id].total = stat.total;
        stats.total_orders += stat.count;
        stats.total_amount += stat.total;
      }
    });

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error("Error generating purchase order statistics:", error);
    return {
      success: false,
      message: "Failed to generate statistics",
      error: error.message,
    };
  }
});

/**
 * Get a single purchase order by ID
 */
export const getPurchaseOrderById = withRead(async (id) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the purchase order by ID with populated references
    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate('created_by', 'name email')
      .populate('items.raw_material_id');

    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }

    return {
      success: true,
      data: purchaseOrder.toJSON(),
    };
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return {
      success: false,
      message: "Failed to fetch purchase order",
      error: error.message,
    };
  }
});

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = withCreate(async (orderData) => {
  try {
    // Connect to the database
    await dbConnect();
    const session = await getServerSession(authOptions);
    
    // Add the user ID who created the purchase order
    orderData.created_by = session.user.id;
    
    // Calculate total amount if not provided
    if (!orderData.total_amount && orderData.items && orderData.items.length > 0) {
      orderData.total_amount = orderData.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    }

    // Create a new purchase order
    const purchaseOrder = await PurchaseOrder.create(orderData);

    // Update inventory for each raw material in the purchase order
    if (orderData.items && orderData.items.length > 0) {
      for (const item of orderData.items) {
        try {
          // Add the purchased quantity to raw material inventory
          await Inventory.updateStock(
            'raw_material',
            item.raw_material_id,
            parseFloat(item.quantity),
            { userId: session.user.id }
          );
        } catch (inventoryError) {
          console.error(`Error updating inventory for raw material ${item.raw_material_id}:`, inventoryError);
          // Continue with other items even if one fails
        }
      }
    }

    return {
      success: true,
      data: purchaseOrder.toJSON(),
      message: "Purchase order created successfully and inventory updated",
    };
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return {
      success: false,
      message: "Failed to create purchase order",
      error: error.message,
    };
  }
});

/**
 * Update an existing purchase order
 */
export const updatePurchaseOrder = withUpdate(async (id, orderData) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // Calculate total amount if items are being updated
    if (orderData.items && orderData.items.length > 0) {
      orderData.total_amount = orderData.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    }
    
    // Find the purchase order by ID
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }
    
    // Check if the status is being changed
    const isStatusChange = orderData.status && orderData.status !== purchaseOrder.status;
    const oldStatus = purchaseOrder.status;
    const isItemsChange = orderData.items && orderData.items.length > 0;
    
    const session = await getServerSession(authOptions);
    
    // Handle inventory updates based on status changes
    if (isStatusChange) {
      // If changing from any status to "received", add items to inventory
      if (orderData.status === 'received' && oldStatus !== 'received') {
        const itemsToAdd = orderData.items || purchaseOrder.items;
        if (itemsToAdd && itemsToAdd.length > 0) {
          for (const item of itemsToAdd) {
            try {
              await Inventory.updateStock(
                'raw_material',
                item.raw_material_id,
                parseFloat(item.quantity),
                { userId: session.user.id }
              );
            } catch (inventoryError) {
              console.error(`Error updating inventory for raw material ${item.raw_material_id}:`, inventoryError);
            }
          }
        }
      }
      
      // If changing from "received" to another status, remove items from inventory
      if (oldStatus === 'received' && orderData.status !== 'received') {
        if (purchaseOrder.items && purchaseOrder.items.length > 0) {
          for (const item of purchaseOrder.items) {
            try {
              await Inventory.updateStock(
                'raw_material',
                item.raw_material_id,
                -parseFloat(item.quantity), // Negative to remove from inventory
                { userId: session.user.id }
              );
            } catch (inventoryError) {
              console.error(`Error removing inventory for raw material ${item.raw_material_id}:`, inventoryError);
            }
          }
        }
      }
    }
    
    // Handle inventory updates for quantity changes (only if status is received)
    if (isItemsChange && (purchaseOrder.status === 'received' || orderData.status === 'received')) {
      // Calculate the difference between old and new quantities
      const oldItems = purchaseOrder.items || [];
      const newItems = orderData.items || [];
      
      // Create maps for easy comparison
      const oldItemsMap = new Map();
      oldItems.forEach(item => {
        oldItemsMap.set(item.raw_material_id.toString(), parseFloat(item.quantity));
      });
      
      const newItemsMap = new Map();
      newItems.forEach(item => {
        newItemsMap.set(item.raw_material_id.toString(), parseFloat(item.quantity));
      });
      
      // Update inventory based on quantity differences
      for (const [materialId, newQuantity] of newItemsMap) {
        const oldQuantity = oldItemsMap.get(materialId) || 0;
        const quantityDiff = newQuantity - oldQuantity;
        
        if (quantityDiff !== 0) {
          try {
            await Inventory.updateStock(
              'raw_material',
              materialId,
              quantityDiff,
              { userId: session.user.id }
            );
          } catch (inventoryError) {
            console.error(`Error updating inventory for raw material ${materialId}:`, inventoryError);
          }
        }
      }
      
      // Handle removed items (items that were in old but not in new)
      for (const [materialId, oldQuantity] of oldItemsMap) {
        if (!newItemsMap.has(materialId)) {
          try {
            await Inventory.updateStock(
              'raw_material',
              materialId,
              -oldQuantity, // Remove the entire old quantity
              { userId: session.user.id }
            );
          } catch (inventoryError) {
            console.error(`Error removing inventory for raw material ${materialId}:`, inventoryError);
          }
        }
      }
    }
    
    // Update the purchase order
    if (isStatusChange) {
      // Update the status
      purchaseOrder.status = orderData.status;
      
      // Update other fields separately
      delete orderData.status;
      if (Object.keys(orderData).length > 0) {
        Object.assign(purchaseOrder, orderData);
      }
      
      await purchaseOrder.save();
    } else {
      // Standard update for non-status changes
      Object.assign(purchaseOrder, orderData);
      await purchaseOrder.save();
    }
    
    // Refresh the purchase order with populated references
    const updatedOrder = await PurchaseOrder.findById(id)
      .populate('created_by', 'name email')
      .populate('items.raw_material_id');
      
    return {
      success: true,
      data: updatedOrder.toJSON(),
      statusChanged: isStatusChange,
      oldStatus: isStatusChange ? oldStatus : null,
      newStatus: isStatusChange ? orderData.status : null,
      message: "Purchase order updated successfully" + 
               (isStatusChange || isItemsChange ? " and inventory updated" : ""),
    };
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return {
      success: false,
      message: "Failed to update purchase order",
      error: error.message,
    };
  }
});

/**
 * Delete a purchase order
 */
export const deletePurchaseOrder = withDelete(async (id) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // Find the purchase order by ID
    const purchaseOrder = await PurchaseOrder.findById(id);
    
    if (!purchaseOrder) {
      return {
        success: false,
        message: "Purchase order not found",
      };
    }
    
    // Only allow deletion of draft or cancelled purchase orders
    if (!['draft', 'cancelled'].includes(purchaseOrder.status)) {
      return {
        success: false,
        message: `Cannot delete purchase order with status "${purchaseOrder.status}". Only draft or cancelled orders can be deleted.`,
      };
    }
    
    // Main deletion logic
    const deletedPurchaseOrder = await PurchaseOrder.findByIdAndDelete(id);
    
    if (!deletedPurchaseOrder) {
      return {
        success: false,
        message: "Failed to delete purchase order - document not found during deletion",
      };
    }
    
    return {
      success: true,
      message: "Purchase order deleted successfully",
      data: {
        deletedId: deletedPurchaseOrder._id,
        orderNumber: deletedPurchaseOrder.orderNumber || null,
      }
    };
  } catch (error) {
    console.error("Error deleting purchase order:", error);
    return {
      success: false,
      message: "Failed to delete purchase order",
      error: error.message,
    };
  }
});
