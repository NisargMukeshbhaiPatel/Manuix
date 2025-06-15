import mongoose from "mongoose";

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
      enum: ['SalesOrder', 'PurchaseOrder', 'Other'],
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
      ref: "User",
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
    toJSON: { getters: true },
    toObject: { getters: true },
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

// Index for queries (removed duplicate date index since it's already indexed in schema)
FinanceSchema.index({ type: 1, date: 1 });
FinanceSchema.index({ source_type: 1, source_id: 1 });

// Static method to create a finance entry from a sales order
FinanceSchema.statics.createFromSalesOrder = async function(salesOrder, userId) {
  if (!salesOrder || !salesOrder._id) {
    throw new Error('Invalid sales order');
  }
  
  // Calculate the total amount from the sales order
  let amount = 0;
  if (salesOrder.orderTotal) {
    amount = salesOrder.orderTotal;
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
  
  const financeEntry = new this({
    type: 'income',
    source_type: 'SalesOrder',
    source_id: salesOrder._id,
    amount: amount,
    description: `Sales to ${customerName} - Order #${salesOrder._id.toString().slice(-6).toUpperCase()}`,
    date: new Date(),
    created_by: userId,
    category: 'Sales',
  });
  
  return financeEntry.save();
};

// Static method to create a finance entry from a purchase order
FinanceSchema.statics.createFromPurchaseOrder = async function(purchaseOrder, userId) {
  if (!purchaseOrder || !purchaseOrder._id) {
    throw new Error('Invalid purchase order');
  }
  
  // Calculate the total amount from the purchase order
  let amount = 0;
  if (purchaseOrder.orderTotal) {
    amount = purchaseOrder.orderTotal;
  } else if (purchaseOrder.items && purchaseOrder.items.length > 0) {
    amount = purchaseOrder.items.reduce((sum, item) => {
      const itemQty = parseFloat(item.quantity?.toString() || '0');
      const itemPrice = parseFloat(item.price?.toString() || '0');
      return sum + (itemQty * itemPrice);
    }, 0);
  }
  
  if (amount <= 0) {
    throw new Error('Purchase order has no valid amount');
  }
  
  const supplierName = purchaseOrder.supplier_name || 'Unknown Supplier';
  
  const financeEntry = new this({
    type: 'expense',
    source_type: 'PurchaseOrder',
    source_id: purchaseOrder._id,
    amount: amount,
    description: `Raw Material Purchase from ${supplierName} - PO #${purchaseOrder._id.toString().slice(-6).toUpperCase()}`,
    date: new Date(),
    created_by: userId,
    category: 'Raw Materials',
  });
  
  return financeEntry.save();
};

// Static method to get financial summary for a period
FinanceSchema.statics.getSummary = async function(startDate, endDate) {
  const query = {};
  
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
      categories[category] = { income: 0, expense: 0, net: 0 };
    }
    categories[category][type] += t.total;
    categories[category].net = categories[category].income - categories[category].expense;
  });
  
  return {
    income: {
      total: totalIncome,
      count: income.length > 0 ? income[0].count : 0
    },
    expenses: {
      total: totalExpenses,
      count: expenses.length > 0 ? expenses[0].count : 0
    },
    profit,
    categories
  };
};

// Automatically populate source references when accessing Finance entries
FinanceSchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('created_by', 'name email')
        .populate('source_id');
  }
  next();
});

export default mongoose.models.Finance || mongoose.model("Finance", FinanceSchema);
