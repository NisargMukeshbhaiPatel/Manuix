"use server";

import { getServerSession } from "next-auth/next";
import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Finance from "@/models/Finance";
import { authOptions } from "@/lib/auth";
import { createCollectionRBAC } from "@/lib/rbac";

const { withCreate, withRead, withUpdate, withDelete } = createCollectionRBAC("finances");

/**
 * Get all financial transactions with pagination and filtering
 */
export const getFinanceTransactions = withRead(async ({ 
  page = 1, 
  limit = 10, 
  type = null, 
  startDate = null, 
  endDate = null,
  refType = null,
  refId = null
} = {}) => {
  try {
    // Connect to the database
    await dbConnect();
    
    // Create the query
    const query = {};
    
    // Apply transaction type filter if provided
    if (type) {
      query.type = type;
    }

    // Apply date range filter if provided
    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    // Apply reference filters if provided
    if (refType) {
      query.source_type = refType;
    }
    if (refId) {
      query.reference_number = { $regex: refId, $options: "i" }; // Case-insensitive search
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
      .sort({ date: -1, createdAt: -1 }); // Sort by transaction date (newest first)

    return {
      success: true,
      data: transactions.map(t => t.toJSON()),
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
});

/**
 * Get financial summary (income, expenses, profit for date range)
 */
export const getFinanceSummary = withRead(async ({ startDate, endDate } = {}) => {
  try {
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
    const query = dateFilter ? { date: dateFilter } : {};

    // Use MongoDB aggregation to calculate summary
    const summary = await Finance.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$type",
          total: { $sum: { $toDouble: "$amount" } }
        }
      }
    ]);

    // Process the summary results
    let income = 0;
    let expenses = 0;

    summary.forEach(item => {
      if (item._id === 'income') {
        income += item.total;
      } else if (item._id === 'expense') {
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
});

/**
 * Get a single financial transaction by ID
 */
export const getFinanceTransactionById = withRead(async (id) => {
  try {
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
      data: transaction.toJSON(),
    };
  } catch (error) {
    console.error("Error fetching transaction:", error);
    return {
      success: false,
      message: "Failed to fetch transaction",
      error: error.message,
    };
  }
});

/**
 * Create a new financial transaction
 */
export const createFinanceTransaction = withCreate(async (transactionData) => {
  try {
    // Connect to the database
    await dbConnect();

    // Add the user ID who created the transaction
    const session = await getServerSession(authOptions);
    transactionData.created_by = session.user.id;

    // Create a new transaction
    const transaction = await Finance.create(transactionData);
    
    // Populate references for the response
    await transaction.populate('created_by', 'name email');

    // Revalidate the finance cache
    revalidatePath('/finance');

    return {
      success: true,
      data: transaction.toJSON(),
    };
  } catch (error) {
    console.error("Error creating financial transaction:", error);
    return {
      success: false,
      message: "Failed to create financial transaction",
      error: error.message,
    };
  }
});

/**
 * Update an existing financial transaction
 */
export const updateFinanceTransaction = withUpdate(async (id, transactionData) => {
  try {
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
      data: transaction.toJSON(),
    };
  } catch (error) {
    console.error("Error updating financial transaction:", error);
    return {
      success: false,
      message: "Failed to update financial transaction",
      error: error.message,
    };
  }
});

/**
 * Delete a financial transaction
 */
export const deleteFinanceTransaction = withDelete(async (id) => {
  try {
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
});
