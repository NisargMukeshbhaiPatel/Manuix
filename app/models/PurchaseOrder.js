import mongoose from "mongoose";
import User from "@/models/User";
import RawMaterial from "@/models/RawMaterial";

// PurchaseOrderItem Schema (Subdocument)
const PurchaseOrderItemSchema = new mongoose.Schema(
  {
    raw_material_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: RawMaterial.modelName,
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
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();

        if (ret.quantity) {
          ret.quantity = parseFloat(ret.quantity.toString());
        }

        if (ret.price) {
          ret.price = parseFloat(ret.price.toString());
        }

        if (ret.raw_material_id && mongoose.Types.ObjectId.isValid(ret.raw_material_id)) {
          ret.raw_material_id = ret.raw_material_id.toString();
        }

        if (ret.raw_material_id && typeof ret.raw_material_id === 'object' && ret.raw_material_id._id) {
          ret.raw_material = {
            id: ret.raw_material_id._id.toString(),
            name: ret.raw_material_id.name,
            price: ret.raw_material_id.price ? parseFloat(ret.raw_material_id.price.toString()) : null,
            unit: ret.raw_material_id.unit,
            category: ret.raw_material_id.category
          };
          ret.raw_material_id = ret.raw_material_id.toString();
        }

        return ret;
      }
    },
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
      ref: User.modelName,
      required: [true, "Creator reference is required"],
    },
    items: [PurchaseOrderItemSchema], // Array of PurchaseOrderItems
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        delete ret.__v;

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
      }
    },
    toObject: { getters: true },
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
