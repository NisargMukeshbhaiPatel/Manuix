"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import SalesOrder from "@/models/SalesOrder";
import { createCollectionRBAC } from "@/lib/rbac";

const { withCreate, withRead, withUpdate, withDelete } = createCollectionRBAC("salesorders");

/**
 * Get all sales orders with pagination and filtering
 */
export const getSalesOrders = withRead(async ({ 
  page = 1, 
  limit = 10, 
  status = null,
  customerId = null,
  customerName = null,
  startDate = null,
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

    // Apply customer ID filter if provided
    if (customerId) {
      query.customer_id = customerId;
    }

    // Apply customer name filter if provided
    if (customerName) {
      query.customer_name = { $regex: customerName, $options: "i" }; // Case-insensitive search
    }

    // Apply date range filter if provided
    if (startDate || endDate) {
      query.order_date = {};
      if (startDate) {
        query.order_date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.order_date.$lte = new Date(endDate);
      }
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total sales orders for pagination
    const totalItems = await SalesOrder.countDocuments(query);

    // Retrieve sales orders with pagination and populated references
    const salesOrders = await SalesOrder.find(query)
      .populate('created_by', 'name email')
      .populate('items.product_id')
      .skip(skip)
      .limit(limit)
      .sort({ order_date: -1, createdAt: -1 }); // Sort by order date (newest first)

    return {
      success: true,
      data: salesOrders.map(so => so.toJSON()),
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching sales orders:", error);
    return {
      success: false,
      message: "Failed to fetch sales orders",
      error: error.message,
    };
  }
});

/**
 * Get sales order statistics
 */
export const getSalesOrderStats = withRead(async ({ period = 'month' } = {}) => {
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
    
    const statusStats = await SalesOrder.aggregate(statusQuery);
    
    // Process into a more usable format
    const stats = {
      draft: { count: 0, total: 0 },
      pending: { count: 0, total: 0 },
      processing: { count: 0, total: 0 },
      shipped: { count: 0, total: 0 },
      delivered: { count: 0, total: 0 },
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
    console.error("Error generating sales order statistics:", error);
    return {
      success: false,
      message: "Failed to generate statistics",
      error: error.message,
    };
  }
});

/**
 * Get a single sales order by ID
 */
export const getSalesOrderById = withRead(async (id) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the sales order by ID with populated references
    const salesOrder = await SalesOrder.findById(id)
      .populate('created_by', 'name email')
      .populate('items.product_id');

    if (!salesOrder) {
      return {
        success: false,
        message: "Sales order not found",
      };
    }

    return {
      success: true,
      data: salesOrder.toJSON(),
    };
  } catch (error) {
    console.error("Error fetching sales order:", error);
    return {
      success: false,
      message: "Failed to fetch sales order",
      error: error.message,
    };
  }
});

/**
 * Create a new sales order
 */
export const createSalesOrder = withCreate(async (orderData) => {
  try {
    // Connect to the database
    await dbConnect();
    const session = await getServerSession(authOptions);
    // Add the user ID who created the sales order
    orderData.created_by = session.user.id;    // Calculate total amount if not provided
    if (!orderData.total_amount && orderData.items && orderData.items.length > 0) {
      orderData.total_amount = orderData.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    }

    // Create a new sales order
    const salesOrder = await SalesOrder.create(orderData);
    
    // Populate references for the response
    await salesOrder.populate('created_by', 'name email');
    await salesOrder.populate('items.product_id');

    // Revalidate the sales orders cache
    revalidatePath('/sales-orders');

    return {
      success: true,
      data: salesOrder.toJSON(),
    };
  } catch (error) {
    console.error("Error creating sales order:", error);
    return {
      success: false,
      message: "Failed to create sales order",
      error: error.message,
    };
  }
});

/**
 * Update an existing sales order
 */
export const updateSalesOrder = withUpdate(async (id, orderData) => {
  try {
    // Connect to the database
    await dbConnect();    // Calculate total amount if items are being updated
    if (orderData.items && orderData.items.length > 0) {
      orderData.total_amount = orderData.items.reduce((total, item) => {
        return total + (item.quantity * item.price);
      }, 0);
    }

    // Find the sales order by ID
    const salesOrder = await SalesOrder.findById(id);
    
    if (!salesOrder) {
      return {
        success: false,
        message: "Sales order not found",
      };
    }
    
    // Check if the status is being changed
    const isStatusChange = orderData.status && orderData.status !== salesOrder.status;
    const oldStatus = salesOrder.status;
    
    // If this is a status change, use the dedicated method
    if (isStatusChange) {
      await salesOrder.updateStatus(orderData.status, session.user.id);
      
      // Update other fields separately
      delete orderData.status;
      if (Object.keys(orderData).length > 0) {
        Object.assign(salesOrder, orderData);
        await salesOrder.save();
      }
    } else {
      // Standard update for non-status changes
      Object.assign(salesOrder, orderData);
      await salesOrder.save();
    }
    
    // Refresh the sales order with populated references
    const updatedOrder = await SalesOrder.findById(id)
      .populate('created_by', 'name email')
      .populate('items.product_id');

    // Revalidate the sales order and sales orders cache
    revalidatePath(`/sales-orders/${id}`);
    revalidatePath('/sales-orders');

    return {
      success: true,
      data: updatedOrder.toJSON(),
      statusChanged: isStatusChange,
      oldStatus: isStatusChange ? oldStatus : null,
      newStatus: isStatusChange ? orderData.status : null,
    };
  } catch (error) {
    console.error("Error updating sales order:", error);
    return {
      success: false,
      message: "Failed to update sales order",
      error: error.message,
    };
  }
});

/**
 * Update payment status for a sales order
 */
export const updateSalesOrderPayment = withUpdate(async (id, paymentData) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the sales order by ID
    const salesOrder = await SalesOrder.findById(id);
    
    if (!salesOrder) {
      return {
        success: false,
        message: "Sales order not found",
      };
    }
    const session = await getServerSession(authOptions);
    // Record the payment
    const result = await salesOrder.recordPayment({
      amount: paymentData.amount,
      method: paymentData.method,
      reference: paymentData.reference,
      notes: paymentData.notes,
      userId: session.user.id
    });

    // Refresh the sales order with populated references
    const updatedOrder = await SalesOrder.findById(id)
      .populate('created_by', 'name email')
      .populate('items.product_id');

    // Revalidate the sales order and sales orders cache
    revalidatePath(`/sales-orders/${id}`);
    revalidatePath('/sales-orders');

    return {
      success: true,
      data: updatedOrder.toJSON(),
      payment: result
    };
  } catch (error) {
    console.error("Error updating sales order payment:", error);
    return {
      success: false,
      message: "Failed to update payment",
      error: error.message,
    };
  }
});

/**
 * Delete a sales order
 */
export const deleteSalesOrder = withDelete(async (id) => {
  try {
    // Connect to the database
    await dbConnect();

    // Find the sales order by ID
    const salesOrder = await SalesOrder.findById(id);
    
    if (!salesOrder) {
      return {
        success: false,
        message: "Sales order not found",
      };
    }
    
    // Only allow deletion of draft or cancelled sales orders
    if (!['draft', 'cancelled'].includes(salesOrder.status)) {
      return {
        success: false,
        message: `Cannot delete sales order with status "${salesOrder.status}". Only draft or cancelled orders can be deleted.`,
      };
    }
    
    // Delete the sales order
    await salesOrder.remove();

    // Revalidate the sales orders cache
    revalidatePath('/sales-orders');

    return {
      success: true,
      message: "Sales order deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting sales order:", error);
    return {
      success: false,
      message: "Failed to delete sales order",
      error: error.message,
    };
  }
});
