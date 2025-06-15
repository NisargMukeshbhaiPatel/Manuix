"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Finance from "@/models/Finance";
import { authOptions } from "@/api/auth/[...nextauth]/route";

/**
 * Get all financial transactions with pagination and filtering
 */
export async function getFinanceTransactions({ 
  page = 1, 
  limit = 10, 
  type = null, 
  startDate = null, 
  endDate = null,
  refType = null,
  refId = null
} = {}) {
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
    
    // Apply transaction type filter if provided
    if (type) {
      query.transaction_type = type;
    }

    // Apply date range filter if provided
    if (startDate || endDate) {
      query.transaction_date = {};
      if (startDate) {
        query.transaction_date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.transaction_date.$lte = new Date(endDate);
      }
    }

    // Apply reference filters if provided
    if (refType) {
      query.reference_type = refType;
    }
    if (refId) {
      query.reference_id = refId;
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Count total transactions for pagination
    const totalItems = await Finance.countDocuments(query);

    // Retrieve transactions with pagination and populate references
    const transactions = await Finance.find(query)
      .populate('created_by', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ transaction_date: -1, createdAt: -1 }); // Sort by transaction date (newest first)

    return {
      success: true,
      data: transactions,
      pagination: {
        total: totalItems,
        page,
        limit,
        pages: Math.ceil(totalItems / limit),
      },
    };
  } catch (error) {
    console.error("Error fetching financial transactions:", error);
    return {
      success: false,
      message: "Failed to fetch financial transactions",
      error: error.message,
    };
  }
}

/**
 * Get financial summary (income, expenses, profit for date range)
 */
export async function getFinanceSummary({ startDate, endDate } = {}) {
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

    // Create date range filter
    const dateFilter = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate);
    }

    // Create the query with date filter if provided
    const query = dateFilter ? { transaction_date: dateFilter } : {};

    // Use MongoDB aggregation to calculate summary
    const summary = await Finance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$transaction_type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    // Process the summary results
    let income = 0;
    let expenses = 0;

    summary.forEach(item => {
      if (item._id === 'income' || item._id === 'sales') {
        income += item.total;
      } else if (item._id === 'expense' || item._id === 'purchase') {
        expenses += item.total;
      }
    });

    const profit = income - expenses;

    return {
      success: true,
      data: {
        income,
        expenses,
        profit,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      }
    };
  } catch (error) {
    console.error("Error generating financial summary:", error);
    return {
      success: false,
      message: "Failed to generate financial summary",
      error: error.message,
    };
  }
}

/**
 * Get a single financial transaction by ID
 */
export async function getFinanceTransactionById(id) {
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

    // Find the transaction by ID with populated references
    const transaction = await Finance.findById(id)
      .populate('created_by', 'name email');

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      message: "Failed to fetch transaction",
      error: error.message,
    };
  }
}

/**
 * Create a new financial transaction
 */
export async function createFinanceTransaction(transactionData) {
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

    // Add the user ID who created the transaction
    transactionData.created_by = session.user.id;

    // Create a new transaction
    const transaction = await Finance.create(transactionData);
    
    // Populate references for the response
    await transaction.populate('created_by', 'name email');

    // Revalidate the finance cache
    revalidatePath('/finance');

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("Error creating financial transaction:", error);
    return {
      success: false,
      message: "Failed to create financial transaction",
      error: error.message,
    };
  }
}

/**
 * Update an existing financial transaction
 */
export async function updateFinanceTransaction(id, transactionData) {
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

    // Find the transaction by ID and update it
    const transaction = await Finance.findByIdAndUpdate(id, transactionData, {
      new: true, // Return the updated document
      runValidators: true, // Run mongoose validation
    });

    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }
    
    // Populate references for the response
    await transaction.populate('created_by', 'name email');

    // Revalidate the finance caches
    revalidatePath(`/finance/${id}`);
    revalidatePath('/finance');

    return {
      success: true,
      data: transaction,
    };
  } catch (error) {
    console.error("Error updating financial transaction:", error);
    return {
      success: false,
      message: "Failed to update financial transaction",
      error: error.message,
    };
  }
}

/**
 * Delete a financial transaction
 */
export async function deleteFinanceTransaction(id) {
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

    // Find the transaction by ID and delete it
    const transaction = await Finance.findByIdAndDelete(id);
    
    if (!transaction) {
      return {
        success: false,
        message: "Transaction not found",
      };
    }

    // Revalidate the finance cache
    revalidatePath('/finance');

    return {
      success: true,
      message: "Financial transaction deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting financial transaction:", error);
    return {
      success: false,
      message: "Failed to delete financial transaction",
      error: error.message,
    };
  }
}
