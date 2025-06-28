import mongoose from "mongoose";
import User from "@/models/User";
import SalesOrder from "@/models/SalesOrder";
import PurchaseOrder from "@/models/PurchaseOrder";

const FinanceSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['income', 'expense'],
      index: true,
    },
    source_type: {
      type: String,
      required: true,
      enum: [SalesOrder.modelName, PurchaseOrder.modelName, 'Other'],
      index: true,
    },
    source_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'source_type',
      required: function() {
        return this.source_type !== 'Other'; // Required unless it's a manual entry
      },
      index: true,
    },
    amount: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Amount is required"],
      get: (v) => v ? v.toString() : v, // Convert Decimal128 to string when retrieved
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: [true, "Creator reference is required"],
    },
    // Optional fields for more detailed finance tracking
    category: {
      type: String,
      trim: true,
      index: true,
    },
    payment_method: {
      type: String,
      trim: true,
    },
    reference_number: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        // Convert _id to string
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;

        // Convert amount to number
        if (ret.amount) {
          ret.amount = parseFloat(ret.amount.toString());
        }

        // Convert date to ISO string
        if (ret.date) {
          ret.date = ret.date.toISOString();
        }

        // Handle timestamps
        if (ret.createdAt) {
          ret.createdAt = ret.createdAt.toISOString();
        }
        if (ret.updatedAt) {
          ret.updatedAt = ret.updatedAt.toISOString();
        }

        // Handle created_by - extract only essential info if populated
        if (ret.created_by) {
          if (typeof ret.created_by === 'object' && ret.created_by._id) {
            ret.creator = {
              id: ret.created_by._id.toString(),
              name: ret.created_by.name,
              email: ret.created_by.email
            };
            ret.created_by = ret.created_by._id.toString();
          } else if (mongoose.Types.ObjectId.isValid(ret.created_by)) {
            ret.created_by = ret.created_by.toString();
          }
        }

        // Handle source_id - extract only essential info if populated
        if (ret.source_id) {
          if (typeof ret.source_id === 'object' && ret.source_id._id) {
            ret.source = {
              id: ret.source_id._id.toString(),
              type: ret.source_type,
            };
            
            // Add type-specific fields
            if (ret.source_type === SalesOrder.modelName) {
              ret.source.customer_name = ret.source_id.customer_name;
              ret.source.status = ret.source_id.status;
              ret.source.order_number = ret.source_id.order_number;
            } else if (ret.source_type === PurchaseOrder.modelName) {
              ret.source.supplier_name = ret.source_id.supplier_name;
              ret.source.status = ret.source_id.status;
              ret.source.order_number = ret.source_id.order_number;
            }
            
            ret.source_id = ret.source_id._id.toString();
          } else if (mongoose.Types.ObjectId.isValid(ret.source_id)) {
            ret.source_id = ret.source_id.toString();
          }
        }

        return ret;
      }
    },
    toObject: { 
      getters: true,
      transform: function(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
  }
);

// Virtual field to handle decimal display
FinanceSchema.virtual('amountDecimal').get(function() {
  return this.amount ? parseFloat(this.amount.toString()) : 0;
});

// Virtual field to represent sign-adjusted amount (positive for income, negative for expense)
FinanceSchema.virtual('signedAmount').get(function() {
  const amount = this.amountDecimal;
  return this.type === 'income' ? amount : -amount;
});

// Indexes for efficient queries
FinanceSchema.index({ type: 1, date: 1 });
FinanceSchema.index({ source_type: 1, source_id: 1 });
FinanceSchema.index({ created_by: 1, date: -1 });
FinanceSchema.index({ category: 1, type: 1 });

// Static method to create a finance entry from a sales order
FinanceSchema.statics.createFromSalesOrder = async function(salesOrder, userId) {
  if (!salesOrder || !salesOrder._id) {
    throw new Error('Invalid sales order');
  }
  
  // Calculate the total amount from the sales order
  let amount = 0;
  if (salesOrder.orderTotal) {
    amount = parseFloat(salesOrder.orderTotal.toString());
  } else if (salesOrder.items && salesOrder.items.length > 0) {
    amount = salesOrder.items.reduce((sum, item) => {
      const itemQty = parseFloat(item.quantity?.toString() || '0');
      const itemPrice = parseFloat(item.price?.toString() || '0');
      return sum + (itemQty * itemPrice);
    }, 0);
  }
  
  if (amount <= 0) {
    throw new Error('Sales order has no valid amount');
  }
  
  const customerName = salesOrder.customer_name || 'Unknown Customer';
  const orderRef = salesOrder.order_number || salesOrder._id.toString().slice(-6).toUpperCase();
  
  const financeEntry = new this({
    type: 'income',
    source_type: SalesOrder.modelName,
    source_id: salesOrder._id,
    amount: amount,
    description: `Sales to ${customerName} - Order #${orderRef}`,
    date: salesOrder.order_date || new Date(),
    created_by: userId,
    category: 'Sales',
    reference_number: orderRef,
  });
  
  return financeEntry.save();
};

// Static method to create a finance entry from a purchase order
FinanceSchema.statics.createFromPurchaseOrder = async function(purchaseOrder, userId) {
  console.log('Creating finance entry for purchase order:', purchaseOrder._id);
  
  if (!purchaseOrder || !purchaseOrder._id) {
    throw new Error('Invalid purchase order');
  }
  
  // Calculate the total amount from the purchase order
  let amount = 0;
  if (purchaseOrder.orderTotal) {
    amount = parseFloat(purchaseOrder.orderTotal.toString());
  } else if (purchaseOrder.items && purchaseOrder.items.length > 0) {
    amount = purchaseOrder.items.reduce((sum, item) => {
      const itemQty = parseFloat(item.quantity?.toString() || '0');
      const itemPrice = parseFloat(item.price?.toString() || '0');
      return sum + (itemQty * itemPrice);
    }, 0);
  }
  
  console.log('Calculated amount for purchase order:', amount);
  
  if (amount <= 0) {
    throw new Error('Purchase order has no valid amount');
  }
  
  const supplierName = purchaseOrder.supplier_name || 'Unknown Supplier';
  const orderRef = purchaseOrder.order_number || purchaseOrder._id.toString().slice(-6).toUpperCase();
  
  const financeEntry = new this({
    type: 'expense',
    source_type: PurchaseOrder.modelName,
    source_id: purchaseOrder._id,
    amount: amount,
    description: `Raw Material Purchase from ${supplierName} - PO #${orderRef}`,
    date: purchaseOrder.order_date || new Date(),
    created_by: userId,
    category: 'Raw Materials',
    reference_number: orderRef,
  });
  
  console.log('Created finance entry:', financeEntry.toJSON());
  
  const saved = await financeEntry.save();
  console.log('Saved finance entry with ID:', saved._id);
  
  return saved;
};

// Static method to get financial summary for a period
FinanceSchema.statics.getSummary = async function(startDate, endDate, filters = {}) {
  const query = { ...filters };
  
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = new Date(startDate);
    if (endDate) query.date.$lte = new Date(endDate);
  }
  
  const [income, expenses, transactions] = await Promise.all([
    // Total income
    this.aggregate([
      { $match: { ...query, type: 'income' } },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: "$amount" } },
          count: { $sum: 1 }
        } 
      }
    ]),
    // Total expenses
    this.aggregate([
      { $match: { ...query, type: 'expense' } },
      { 
        $group: { 
          _id: null, 
          total: { $sum: { $toDouble: "$amount" } },
          count: { $sum: 1 }
        } 
      }
    ]),
    // Category breakdown
    this.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: { type: "$type", category: "$category" },
          total: { $sum: { $toDouble: "$amount" } },
          count: { $sum: 1 }
        } 
      },
      { $sort: { "_id.type": 1, total: -1 } }
    ])
  ]);
  
  const totalIncome = income.length > 0 ? income[0].total : 0;
  const totalExpenses = expenses.length > 0 ? expenses[0].total : 0;
  const profit = totalIncome - totalExpenses;
  
  // Process category breakdown
  const categories = {};
  transactions.forEach(t => {
    const type = t._id.type;
    const category = t._id.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = { income: 0, expense: 0, net: 0, count: 0 };
    }
    categories[category][type] += t.total;
    categories[category].count += t.count;
    categories[category].net = categories[category].income - categories[category].expense;
  });
  
  return {
    period: {
      startDate: startDate ? new Date(startDate).toISOString() : null,
      endDate: endDate ? new Date(endDate).toISOString() : null,
    },
    income: {
      total: Number(totalIncome.toFixed(2)),
      count: income.length > 0 ? income[0].count : 0
    },
    expenses: {
      total: Number(totalExpenses.toFixed(2)),
      count: expenses.length > 0 ? expenses[0].count : 0
    },
    profit: Number(profit.toFixed(2)),
    categories: Object.keys(categories).map(name => ({
      name,
      income: Number(categories[name].income.toFixed(2)),
      expense: Number(categories[name].expense.toFixed(2)),
      net: Number(categories[name].net.toFixed(2)),
      count: categories[name].count
    })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net))
  };
};

// Static method to get recent transactions
FinanceSchema.statics.getRecentTransactions = async function(limit = 10, filters = {}) {
  return this.find(filters)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .populate('created_by', 'name email')
    .populate('source_id')
    .lean();
};

// Automatically populate source references when accessing Finance entries (but not for aggregation queries)
FinanceSchema.pre(/^find/, function(next) {
  // Only populate if not using lean() and not explicitly skipping population
  if (this.options && !this.options.lean && !this.options.skipPopulation) {
    this.populate('created_by', 'name email')
        .populate('source_id');
  }
  next();
});

// Pre-save middleware to ensure amount is positive
FinanceSchema.pre('save', function(next) {
  if (this.amount && parseFloat(this.amount.toString()) < 0) {
    return next(new Error('Amount must be positive'));
  }
  next();
});

export default mongoose.models.Finance || mongoose.model("Finance", FinanceSchema);
