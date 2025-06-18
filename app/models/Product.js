import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a product name"],
      maxlength: [100, "Product name cannot be more than 100 characters"],
    },
    sku: {
      type: String,
      required: [true, "Please provide a SKU"],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    unit: {
      type: String,
      required: [true, "Please provide a unit of measurement"],
      trim: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Please provide a sale price"],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator reference is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret._id = ret._id.toString();
        ret.created_by = ret.created_by.toString();
        ret.price = Number(ret.price);
        return ret;
      },
    },
  },
);

// Method to check if this product is in inventory
ProductSchema.methods.isInInventory = async function() {
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) return false;
  
  // Use the static method from Inventory model
  const level = await Inventory.getStockLevel('product', this._id);
  return level > 0;
};

// Method to get current inventory level
ProductSchema.methods.getInventoryLevel = async function() {
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) return 0;
  
  // Use the static method from Inventory model
  return await Inventory.getStockLevel('product', this._id);
};

// Method to check if this product has a BOM defined
ProductSchema.methods.hasBOM = async function() {
  const BOM = mongoose.models.BOM;
  if (!BOM) return false;
  
  const bom = await BOM.findOne({ product_id: this._id });
  return bom !== null;
};

// Method to get the BOM for this product
ProductSchema.methods.getBOM = async function() {
  const BOM = mongoose.models.BOM;
  if (!BOM) return null;
  
  return await BOM.findOne({ product_id: this._id })
    .populate('items.raw_material_id');
};

// Method to check if we can produce this product based on raw material inventory
ProductSchema.methods.canProduce = async function(quantity = 1) {
  // First get the BOM
  const bom = await this.getBOM();
  if (!bom) return { 
    canProduce: false, 
    message: "No BOM defined for this product", 
    producibleQuantity: 0 
  };
  
  // Check inventory availability
  const availability = await bom.checkInventoryAvailability(quantity);
  
  // Calculate max producible quantity if there are shortages
  let producibleQuantity = quantity;
  
  if (!availability.available && availability.shortages.length > 0) {
    // Find the most limiting raw material
    for (const shortage of availability.shortages) {
      const materialQuantityInBOM = bom.items.find(
        item => item.raw_material_id._id.toString() === shortage.materialId.toString()
      ).quantityDecimal;
      
      if (materialQuantityInBOM > 0) {
        const possibleQuantity = Math.floor(shortage.available / materialQuantityInBOM);
        producibleQuantity = Math.min(producibleQuantity, possibleQuantity);
      } else {
        producibleQuantity = 0;
      }
    }
  }
  
  return {
    canProduce: availability.available,
    message: availability.message,
    shortages: availability.shortages || [],
    producibleQuantity
  };
};

export default mongoose.models.Product || mongoose.model("Product", ProductSchema);
