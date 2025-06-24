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
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        delete ret.__v;

        if (ret.quantity) {
          ret.quantity = parseFloat(ret.quantity.toString());
        }

        if (ret.last_updated) {
          ret.last_updated = ret.last_updated.toISOString();
        }

        if (ret.item_id && mongoose.Types.ObjectId.isValid(ret.item_id)) {
          ret.item_id = ret.item_id.toString();
        }

        if (ret.item_id && typeof ret.item_id === 'object' && ret.item_id._id) {
          ret.item = {
            id: ret.item_id._id.toString(),
            name: ret.item_id.name,
            type: ret.item_type,
            ...(ret.item_type === 'product' && {
              sku: ret.item_id.sku,
              price: ret.item_id.price ? parseFloat(ret.item_id.price.toString()) : null,
              category: ret.item_id.category,
              unit: ret.item_id.unit,
            }),
            ...(ret.item_type === 'raw_material' && {
              price: ret.item_id.price ? parseFloat(ret.item_id.price.toString()) : null,
              unit: ret.item_id.unit,
              category: ret.item_id.category
            })
          };
          ret.item_id = ret.item_id._id.toString();
        }

        return ret;
      }
    },
    toObject: { getters: true },
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

// Static method to produce products by consuming raw materials
InventorySchema.statics.produceProducts = async function(productId, quantity, options = {}) {
  try {
    // Get the product instance
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Check if the product can be produced
    const productionCheck = await product.canProduce(quantity);
    if (!productionCheck.canProduce) {
      return {
        success: false,
        message: productionCheck.message,
        shortages: productionCheck.shortages || [],
        producibleQuantity: productionCheck.producibleQuantity || 0
      };
    }

    // Get the BOM for this product
    const bom = await product.getBOM();
    if (!bom) {
      throw new Error('No BOM found for this product');
    }

    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct raw materials from inventory
      for (const bomItem of bom.items) {
        const requiredQuantity = parseFloat(bomItem.quantity.toString()) * quantity;
        
        // Update raw material inventory (negative change to deduct)
        await this.updateStock(
          'raw_material',
          bomItem.raw_material_id._id,
          -requiredQuantity,
          { ...options, session }
        );
      }

      // Add produced products to inventory
      const producedInventory = await this.updateStock(
        'product',
        productId,
        quantity,
        { ...options, session }
      );

      // Commit the transaction
      await session.commitTransaction();

      return {
        success: true,
        message: `Successfully produced ${quantity} units of ${product.name}`,
        data: {
          productId: productId.toString(),
          quantityProduced: quantity,
          newInventoryLevel: parseFloat(producedInventory.quantity.toString()),
          rawMaterialsConsumed: bom.items.map(item => ({
            materialId: item.raw_material_id._id.toString(),
            materialName: item.raw_material_id.name,
            quantityConsumed: parseFloat(item.quantity.toString()) * quantity
          }))
        }
      };

    } catch (error) {
      // Rollback the transaction on error
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error in produceProducts:', error);
    return {
      success: false,
      message: error.message || 'Failed to produce products',
      error: error.message
    };
  }
};

// Middleware to populate the referenced item when requested
InventorySchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('item_id');
  }
  next();
});

export default mongoose.models.Inventory || mongoose.model("Inventory", InventorySchema);
