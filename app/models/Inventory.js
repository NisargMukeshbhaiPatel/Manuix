import mongoose from "mongoose";
import Product from "@/models/Product";
import RawMaterial from "@/models/RawMaterial";

const InventorySchema = new mongoose.Schema(
  {
    item_type: {
      type: String,
      required: true,
      enum: ['product', 'raw_material'],
      index: true,
    },
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'item_type_ref',
      index: true,
    },
    item_type_ref: {
      type: String,
      required: true,
      enum: [Product.modelName, RawMaterial.modelName],
    },
    quantity: {
      type: mongoose.Schema.Types.Decimal128,
      required: true,
      default: 0,
      get: (v) => v ? v.toString() : v, // Convert Decimal128 to string when retrieved
    },
    last_updated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true }, // Apply getters during document conversion to JSON
  }
);

// Pre-save hook to set item_type_ref
InventorySchema.pre('save', function(next) {
  if (this.isModified('item_type') || this.isNew) {
    this.item_type_ref = this.item_type === 'product' ? Product.modelName : RawMaterial.modelName;
  }
  next();
});

// Compound index for quick lookups by item_type and item_id combination
InventorySchema.index({ item_type: 1, item_id: 1 }, { unique: true });

// Virtual field to handle decimal display since Decimal128 can sometimes be tricky in JavaScript
InventorySchema.virtual('quantityDecimal').get(function() {
  return this.quantity ? parseFloat(this.quantity.toString()) : 0;
});

// Method to update inventory quantity
InventorySchema.methods.updateQuantity = async function(change) {
  // Parse existing quantity and change amount to handle accurately
  const currentQty = parseFloat(this.quantity.toString() || '0');
  const changeAmount = parseFloat(change.toString() || '0');
  
  // Update quantity and last_updated timestamp
  this.quantity = currentQty + changeAmount;
  this.last_updated = new Date();
  
  return this.save();
};

// Static method to update or create inventory entry
InventorySchema.statics.updateStock = async function(itemType, itemId, change, options = {}) {
  const typeRef = itemType === 'product' ? Product.modelName : RawMaterial.modelName;
  
  // Find and update or create new entry if it doesn't exist
  const inventory = await this.findOneAndUpdate(
    { item_type: itemType, item_id: itemId },
    {
      $inc: { quantity: change },
      last_updated: new Date(),
      item_type_ref: typeRef
    },
    { 
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    }
  );
  
  // Check for low stock thresholds and create notifications if needed
  try {
    const newQuantity = parseFloat(inventory.quantity.toString());
    const threshold = options.threshold || (itemType === 'product' ? 5 : 10); // Default thresholds
    
    // Only check for low stock if the item exists and we're removing stock or at low levels
    if (newQuantity <= threshold && (change < 0 || newQuantity <= threshold / 2)) {
      // Populate the item to get its name
      await inventory.populate('item_id');
      
      const Notification = mongoose.models.Notification;
      if (Notification && options.userId) {
        await Notification.createInventoryAlert({
          user_id: options.userId,
          item_type: itemType,
          item_id: itemId,
          item_name: inventory.item_id.name || `${typeRef} #${itemId}`,
          current_level: newQuantity,
          threshold_level: threshold,
          action_url: `/inventory/${itemType}/${itemId}`,
          priority: newQuantity === 0 ? 1 : 2, // Higher priority if completely out of stock
        });
      }
    }
  } catch (error) {
    console.error('Error creating inventory notification:', error);
    // Don't stop execution for notification errors
  }
  
  return inventory;
};

// Static method to get current stock level for an item
InventorySchema.statics.getStockLevel = async function(itemType, itemId) {
  const inventory = await this.findOne({ item_type: itemType, item_id: itemId });
  return inventory ? parseFloat(inventory.quantity.toString()) : 0;
};

// Middleware to populate the referenced item when requested
InventorySchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('item_id');
  }
  next();
});

export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);
