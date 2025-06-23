import mongoose from "mongoose";
import User from "@/models/User";
import Product from "@/models/Product";

// SalesOrderItem Schema (Subdocument)
const SalesOrderItemSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Product.modelName,
      required: [true, "Product is required"],
    },
    quantity: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Quantity is required"],
      get: (v) => v ? v.toString() : v, // Convert Decimal128 to string when retrieved
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Price is required"],
      get: (v) => v ? v.toString() : v, // Convert Decimal128 to string when retrieved
    },
  },
  {
    _id: true, // Keep _id for each SalesOrderItem
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();

        if (ret.quantity) {
          ret.quantity = parseFloat(ret.quantity.toString());
        }

        if (ret.price) {
          ret.price = parseFloat(ret.price.toString());
        }

        if (ret.product_id && typeof ret.product_id === 'object' && ret.product_id._id) {
          ret.product = {
            id: ret.product_id._id.toString(),
            price: ret.product_id.price ? parseFloat(ret.product_id.price.toString()) : null,
            ...ret.product_id,
          };
          ret.product_id = ret.product_id.toString();
        } else {
          ret.product_id = ret.product_id.toString();
        }


        return ret;
      }
    },
    toObject: { getters: true },
  }
);

// Virtual fields to handle decimal display
SalesOrderItemSchema.virtual('quantityDecimal').get(function() {
  return this.quantity ? parseFloat(this.quantity.toString()) : 0;
});

SalesOrderItemSchema.virtual('priceDecimal').get(function() {
  return this.price ? parseFloat(this.price.toString()) : 0;
});

// Calculate line total (quantity * price)
SalesOrderItemSchema.virtual('lineTotal').get(function() {
  return this.quantityDecimal * this.priceDecimal;
});

// Main SalesOrder Schema
const SalesOrderSchema = new mongoose.Schema(
  {
    customer_name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'completed', 'cancelled'],
      default: 'draft',
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: [true, "Creator reference is required"],
    },
    items: [SalesOrderItemSchema], // Array of SalesOrderItems
    // Optional finance-related fields
    payment_status: {
      type: String,
      enum: ['unpaid', 'partial', 'paid'],
      default: 'unpaid',
    },
    payment_amount: {
      type: mongoose.Schema.Types.Decimal128,
      default: 0,
      get: (v) => v ? v.toString() : v,
    },
  },
  {
    timestamps: true, // This adds created_at and updated_at automatically
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        delete ret.__v;

        if (ret.payment_amount) {
          ret.payment_amount = parseFloat(ret.payment_amount.toString());
        }

        if (ret.created_by && mongoose.Types.ObjectId.isValid(ret.created_by)) {
          ret.created_by = ret.created_by.toString();
        }

        if (ret.created_by && typeof ret.created_by === 'object' && ret.created_by._id) {
          ret.creator = {
            id: ret.created_by._id.toString(),
            name: ret.created_by.name,
            email: ret.created_by.email
          };
          ret.created_by = ret.created_by._id.toString();
        }

        // Handle items array - they'll be transformed by their own toJSON
        if (ret.items && Array.isArray(ret.items)) {
          ret.items = ret.items.map(item => {
            if (typeof item.toJSON === 'function') {
              return item.toJSON();
            }
            return item;
          });
        }

        return ret;
      },
      virtuals: true,
    },
    toObject: { getters: true },
  }
);

// Calculate total order value
SalesOrderSchema.virtual('orderTotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  return this.items.reduce((total, item) => {
    const itemQuantity = parseFloat(item.quantity.toString()) || 0;
    const itemPrice = parseFloat(item.price.toString()) || 0;
    return total + (itemQuantity * itemPrice);
  }, 0);
});

// Virtual to get payment amount as decimal
SalesOrderSchema.virtual('paymentDecimal').get(function() {
  return this.payment_amount ? parseFloat(this.payment_amount.toString()) : 0;
});

// Calculate remaining balance
SalesOrderSchema.virtual('balanceDue').get(function() {
  return this.orderTotal - this.paymentDecimal;
});

// Pre-save middleware to make sure all SalesOrderItems have their IDs
SalesOrderSchema.pre('save', function(next) {
  if (this.isModified('items')) {
    // Make sure each item has an _id
    this.items.forEach(item => {
      if (!item._id) {
        item._id = new mongoose.Types.ObjectId();
      }
    });
  }
  next();
});

// Method to check if all products have sufficient inventory
SalesOrderSchema.methods.checkInventoryAvailability = async function() {
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) return { available: false, message: "Inventory model not loaded" };
  
  const shortages = [];
  
  // Need to populate product information
  await this.populate('items.product_id');
  
  // Check each product
  for (const item of this.items) {
    if (!item.product_id) continue;
    
    const requiredQty = parseFloat(item.quantity.toString());
    const availableQty = await Inventory.getStockLevel('product', item.product_id._id);
    
    if (availableQty < requiredQty) {
      const productName = item.product_id.name || "Unknown product";
      
      shortages.push({
        productId: item.product_id._id,
        productName,
        sku: item.product_id.sku,
        required: requiredQty,
        available: availableQty,
        shortage: requiredQty - availableQty
      });
    }
  }
  
  return {
    available: shortages.length === 0,
    shortages,
    message: shortages.length > 0 ? `Insufficient quantity for ${shortages.length} products` : "All products available"
  };
};

// Method to complete the sales order and update inventory
SalesOrderSchema.methods.complete = async function() {
  if (this.status !== 'draft') {
    throw new Error(`Cannot complete sales order that is already ${this.status}`);
  }
  
  // Check inventory first
  const inventoryCheck = await this.checkInventoryAvailability();
  if (!inventoryCheck.available) {
    throw new Error(`Cannot complete order: ${inventoryCheck.message}`);
  }
  
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) {
    throw new Error("Inventory model not found");
  }
    // Update inventory for each item (decrease product stock)
  const inventoryUpdates = [];
  
  for (const item of this.items) {
    // Subtract from inventory (notice the negative sign)
    inventoryUpdates.push(
      Inventory.updateStock(
        'product', 
        item.product_id, 
        -1 * parseFloat(item.quantity.toString())
      )
    );
  }
  
  // Wait for all inventory updates to complete
  await Promise.all(inventoryUpdates);
    // Create finance entry for this income
  try {
    const Finance = mongoose.models.Finance;
    if (Finance) {
      // Pass the current user or find a default user if not available
      await Finance.createFromSalesOrder(this, this.created_by);
    }
  } catch (error) {
    console.error('Failed to create finance entry:', error);
    // Don't fail the whole operation if finance entry fails
  }
  
  // Update status to completed
  this.status = 'completed';
  await this.save();
  
  // Create notification for sales order status change
  try {
    const Notification = mongoose.models.Notification;
    if (Notification) {
      // Get the order ID in a readable format
      const orderReference = `SO-${this._id.toString().slice(-6).toUpperCase()}`;
      
      await Notification.createOrderStatusNotification({
        user_id: this.created_by,
        order_type: 'sales',
        order_id: this._id,
        order_reference: orderReference,
        status: 'completed',
        customer_or_supplier: this.customer_name,
        action_url: `/sales-orders/${this._id}`,
        priority: 3,
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't fail the whole operation if notification creation fails
  }
  
  return this;
};

// Method to cancel a sales order
SalesOrderSchema.methods.cancel = async function() {
  // Can only cancel draft orders or restore inventory for completed orders
  if (this.status === 'cancelled') {
    throw new Error('Order is already cancelled');
  }
  
  const Inventory = mongoose.models.Inventory;
  
  // If the order was completed, we need to restore inventory
  if (this.status === 'completed' && Inventory) {
    const inventoryUpdates = [];
    
    for (const item of this.items) {
      // Add back to inventory
      inventoryUpdates.push(
        Inventory.updateStock(
          'product', 
          item.product_id, 
          parseFloat(item.quantity.toString())
        )
      );
    }
    
    // Wait for all inventory updates to complete
    await Promise.all(inventoryUpdates);
  }
    this.status = 'cancelled';
  await this.save();
  
  // Create notification for sales order cancellation
  try {
    const Notification = mongoose.models.Notification;
    if (Notification) {
      // Get the order ID in a readable format
      const orderReference = `SO-${this._id.toString().slice(-6).toUpperCase()}`;
      
      await Notification.createOrderStatusNotification({
        user_id: this.created_by,
        order_type: 'sales',
        order_id: this._id,
        order_reference: orderReference,
        status: 'cancelled',
        customer_or_supplier: this.customer_name,
        action_url: `/sales-orders/${this._id}`,
        priority: 2, // Higher priority for cancellations
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't fail the whole operation if notification creation fails
  }
  
  return this;
};

// Method to record a payment
SalesOrderSchema.methods.recordPayment = async function({ amount }) {
  if (this.status === 'cancelled') {
    throw new Error('Cannot record payment for cancelled order');
  }
  
  const paymentAmount = parseFloat(amount);
  if (isNaN(paymentAmount) || paymentAmount <= 0) {
    throw new Error('Invalid payment amount');
  }
  
  // Update payment amount
  const currentPayment = this.paymentDecimal;
  const newPayment = paymentAmount;
  this.payment_amount = newPayment;
  
  // Update payment status
  if (newPayment >= this.orderTotal) {
    this.payment_status = 'paid';
  } else if (newPayment > 0) {
    this.payment_status = 'partial';
  }
  
  return this.save();
};

//method to your SalesOrderSchema
SalesOrderSchema.methods.updateStatus = async function(newStatus, userId) {
  try {
    const oldStatus = this.status;
    
    // Update the status
    this.status = newStatus;
    
    // Save the document
    await this.save();
    
    return {
      success: true,
      oldStatus,
      newStatus,
      message: `Status updated from ${oldStatus} to ${newStatus}`
    };
    
  } catch (error) {
    throw new Error(`Failed to update status: ${error.message}`);
  }
};


// Automatically populate the product references when accessing SalesOrder
SalesOrderSchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('created_by', 'name email')
        .populate('items.product_id');
  }
  next();
});

export default mongoose.models.SalesOrder || mongoose.model("SalesOrder", SalesOrderSchema);
