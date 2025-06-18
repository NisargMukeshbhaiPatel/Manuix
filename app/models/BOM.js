import mongoose from "mongoose";
import Product from "@/models/Product";
import RawMaterial from "@/models/RawMaterial";
import User from "@/models/User";

// BOMItem Schema (Subdocument)
const BOMItemSchema = new mongoose.Schema(
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
  },
  {
    _id: true, // Keep _id for each BOMItem
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Virtual field to handle decimal display
BOMItemSchema.virtual('quantityDecimal').get(function() {
  return this.quantity ? parseFloat(this.quantity.toString()) : 0;
});

// Main BOM Schema
const BOMSchema = new mongoose.Schema(
  {
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: Product.modelName,
      required: [true, "Product is required"],
      index: true,
      unique: true, // Each product can only have one BOM
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: [true, "Creator reference is required"],
    },
    items: [BOMItemSchema], // Array of BOMItems
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Method to calculate total raw material cost for this BOM
BOMSchema.methods.calculateTotalCost = async function() {
  let total = 0;
  
  // Need to populate the raw materials to get their prices
  await this.populate('items.raw_material_id');
  
  for (const item of this.items) {
    if (item.raw_material_id && item.raw_material_id.price) {
      const itemQuantity = parseFloat(item.quantity.toString());
      const materialPrice = parseFloat(item.raw_material_id.price.toString());
      total += itemQuantity * materialPrice;
    }
  }
  
  return total;
};

// Method to check if this BOM has enough raw materials in inventory
BOMSchema.methods.checkInventoryAvailability = async function(quantity = 1) {
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) return { available: false, message: "Inventory model not loaded" };
  
  const shortages = [];
  
  // Check each raw material
  for (const item of this.items) {
    const requiredQty = parseFloat(item.quantity.toString()) * quantity;
    const availableQty = await Inventory.getStockLevel('raw_material', item.raw_material_id);
    
    if (availableQty < requiredQty) {
      // Need to get the material name
      await item.populate('raw_material_id');
      const materialName = item.raw_material_id.name || "Unknown material";
      
      shortages.push({
        materialId: item.raw_material_id._id,
        materialName,
        required: requiredQty,
        available: availableQty,
        shortage: requiredQty - availableQty
      });
    }
  }
  
  return {
    available: shortages.length === 0,
    shortages,
    message: shortages.length > 0 ? `Insufficient quantity for ${shortages.length} materials` : "All materials available"
  };
};

// Pre-save middleware to make sure all BOMItems have their IDs
BOMSchema.pre('save', function(next) {
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

// Automatically populate the raw_material references when accessing BOM
BOMSchema.pre(/^find/, function(next) {
  if (this.options && !this.options.lean) {
    this.populate('product_id')
        .populate('created_by', 'name email')
        .populate('items.raw_material_id');
  }
  next();
});

export default mongoose.models.BOM || mongoose.model("BOM", BOMSchema);
