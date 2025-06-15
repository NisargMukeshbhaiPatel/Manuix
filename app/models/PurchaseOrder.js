import mongoose from "mongoose";

// PurchaseOrderItem Schema (Subdocument)
const PurchaseOrderItemSchema = new mongoose.Schema(
  {
    raw_material_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RawMaterial",
      required: [true, "Raw material is required"],
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
    _id: true, // Keep _id for each PurchaseOrderItem
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Virtual fields to handle decimal display
PurchaseOrderItemSchema.virtual('quantityDecimal').get(function() {
  return this.quantity ? parseFloat(this.quantity.toString()) : 0;
});

PurchaseOrderItemSchema.virtual('priceDecimal').get(function() {
  return this.price ? parseFloat(this.price.toString()) : 0;
});

// Calculate line total (quantity * price)
PurchaseOrderItemSchema.virtual('lineTotal').get(function() {
  return this.quantityDecimal * this.priceDecimal;
});

// Main PurchaseOrder Schema
const PurchaseOrderSchema = new mongoose.Schema(
  {
    supplier_name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['draft', 'placed', 'received'],
      default: 'draft',
      required: true,
      index: true,
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
    items: [PurchaseOrderItemSchema], // Array of PurchaseOrderItems
  },
  {
    timestamps: true, // This adds created_at and updated_at automatically
    toJSON: { getters: true, virtuals: true },
    toObject: { getters: true, virtuals: true },
  }
);

// Calculate total order value
PurchaseOrderSchema.virtual('orderTotal').get(function() {
  if (!this.items || this.items.length === 0) return 0;
  
  return this.items.reduce((total, item) => {
    const itemQuantity = parseFloat(item.quantity.toString()) || 0;
    const itemPrice = parseFloat(item.price.toString()) || 0;
    return total + (itemQuantity * itemPrice);
  }, 0);
});

// Pre-save middleware to make sure all PurchaseOrderItems have their IDs
PurchaseOrderSchema.pre('save', function(next) {
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

// Method to place the purchase order
PurchaseOrderSchema.methods.place = async function() {
  if (this.status !== 'draft') {
    throw new Error(`Cannot place purchase order that is already ${this.status}`);
  }
  
  this.status = 'placed';
  await this.save();
  
  // Create notification for purchase order status change
  try {
    const Notification = mongoose.models.Notification;
    if (Notification) {
      // Get the order ID in a readable format
      const orderReference = `PO-${this._id.toString().slice(-6).toUpperCase()}`;
      
      await Notification.createOrderStatusNotification({
        user_id: this.created_by,
        order_type: 'purchase',
        order_id: this._id,
        order_reference: orderReference,
        status: 'placed',
        customer_or_supplier: this.supplier_name,
        action_url: `/purchase-orders/${this._id}`,
        priority: 3,
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't fail the whole operation if notification creation fails
  }
  
  return this;
};

// Method to mark the purchase order as received and update inventory
PurchaseOrderSchema.methods.receive = async function() {
  if (this.status !== 'placed') {
    throw new Error(`Cannot receive purchase order that is ${this.status}`);
  }
  
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) {
    throw new Error("Inventory model not found");
  }
  
  // Update inventory for each item
  const inventoryUpdates = [];
  
  for (const item of this.items) {
    inventoryUpdates.push(
      Inventory.updateStock(
        'raw_material', 
        item.raw_material_id, 
        item.quantity
      )
    );
  }
  
  // Wait for all inventory updates to complete
  await Promise.all(inventoryUpdates);
    // Create finance entry for this expense
  try {
    const Finance = mongoose.models.Finance;
    if (Finance) {
      // Pass the current user or find a default user if not available
      await Finance.createFromPurchaseOrder(this, this.created_by);
    }
  } catch (error) {
    console.error('Failed to create finance entry:', error);
    // Don't fail the whole operation if finance entry fails
  }
  
  // Update status to received
  this.status = 'received';
  await this.save();
  
  // Create notification for purchase order status change
  try {
    const Notification = mongoose.models.Notification;
    if (Notification) {
      // Get the order ID in a readable format
      const orderReference = `PO-${this._id.toString().slice(-6).toUpperCase()}`;
      
      await Notification.createOrderStatusNotification({
        user_id: this.created_by,
        order_type: 'purchase',
        order_id: this._id,
        order_reference: orderReference,
        status: 'received',
        customer_or_supplier: this.supplier_name,
        action_url: `/purchase-orders/${this._id}`,
        priority: 3,
      });
    }
  } catch (error) {
    console.error('Failed to create notification:', error);
    // Don't fail the whole operation if notification creation fails
  }
  
  return this;
};

// Method to check if a purchase order can be deleted
PurchaseOrderSchema.methods.canDelete = function() {
  return this.status === 'draft';
};

// Automatically populate the raw_material references when accessing PurchaseOrder
PurchaseOrderSchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('created_by', 'name email')
        .populate('items.raw_material_id');
  }
  next();
});

export default mongoose.models.PurchaseOrder || mongoose.model("PurchaseOrder", PurchaseOrderSchema);
