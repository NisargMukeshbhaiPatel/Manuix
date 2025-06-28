import mongoose from "mongoose";
import Product from "@/models/Product";
import RawMaterial from "@/models/RawMaterial";
import User from "@/models/User";

// BOMItem Schema (Subdocument)
const BOMItemToJson = function (doc, ret) {
  ret._id = ret._id.toString();
  delete ret.__v;
  if (ret.quantity) {
    ret.quantity = Number(ret.quantity.toString());
  }

  if (
    ret.raw_material_id &&
    typeof ret.raw_material_id === "object" &&
    ret.raw_material_id._id
  ) {
    ret.raw_material = {
      id: ret.raw_material_id._id.toString(),
      name: ret.raw_material_id.name,
      price: ret.raw_material_id.price
        ? parseFloat(ret.raw_material_id.price.toString())
        : null,
      unit: ret.raw_material_id.unit,
      category: ret.raw_material_id.category,
    };
    ret.raw_material_id = ret.raw_material_id._id.toString();
  } else {
    ret.raw_material_id = ret.raw_material_id.toString();
  }

  return ret;
};

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
    },
  },
  {
    _id: true, // Keep _id for each BOMItem
    toJSON: {
      transform: BOMItemToJson,
    },
    oObject: { getters: true },
  },
);

// Virtual field to handle decimal display
BOMItemSchema.virtual("quantityDecimal").get(function () {
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
    toJSON: {
      transform: function (doc, ret) {
        ret._id = ret._id.toString();
        delete ret.__v;

        if (ret.product_id && mongoose.Types.ObjectId.isValid(ret.product_id)) {
          ret.product_id = ret.product_id.toString();
        }

        if (
          ret.product_id &&
          typeof ret.product_id === "object" &&
          ret.product_id._id
        ) {
          ret.product = {
            _id: ret.product_id._id.toString(),
            price: ret.product_id.price
              ? parseFloat(ret.product_id.price.toString())
              : null,
            ...ret.product_id,
          };
          ret.product_id = ret.product_id._id.toString();
        }

        if (ret.created_by && ret.created_by._id) {
          ret.creator = {
            id: ret.created_by._id.toString(),
            name: ret.created_by.name,
            email: ret.created_by.email,
          };
          ret.created_by = ret.created_by._id.toString();
        } else {
          ret.created_by = ret.created_by.toString();
        }

        // Handle items array - they'll be transformed by their own toJSON
        if (ret.items && Array.isArray(ret.items)) {
          ret.items = ret.items.map((item) => BOMItemToJson(null, item));
        }

        return ret;
      },
    },
    toObject: { getters: true },
  },
);

// Method to check if this BOM has enough raw materials in inventory
BOMSchema.methods.checkInventoryAvailability = async function (quantity = 1) {
  const Inventory = mongoose.models.Inventory;
  if (!Inventory)
    return { available: false, message: "Inventory model not loaded" };

  // First, populate the raw materials in the items array
  await this.populate('items.raw_material_id');

  const shortages = [];

  // Check each raw material
  for (const item of this.items) {
    const requiredQty = parseFloat(item.quantity.toString()) * quantity;
    const availableQty = await Inventory.getStockLevel(
      "raw_material",
      item.raw_material_id,
    );

    if (availableQty < requiredQty) {
      // Now we can access the material name directly
      const materialName = item.raw_material_id?.name || "Unknown material";

      shortages.push({
        materialId: item.raw_material_id._id,
        materialName,
        required: requiredQty,
        available: availableQty,
        shortage: requiredQty - availableQty,
      });
    }
  }

  return {
    available: shortages.length === 0,
    shortages,
    message:
      shortages.length > 0
        ? `Insufficient materials: ${shortages.map(s => `${s.materialName} (need ${s.required}, have ${s.available})`).join(', ')}`
        : "All materials available",
  };
};

// Pre-save middleware to make sure all BOMItems have their IDs
BOMSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    // Make sure each item has an _id
    this.items.forEach((item) => {
      if (!item._id) {
        item._id = new mongoose.Types.ObjectId();
      }
    });
  }
  next();
});

// Automatically populate the raw_material references when accessing BOM
BOMSchema.pre(/^find/, function (next) {
  if (this.options && !this.options.lean) {
    this.populate("product_id")
      .populate("created_by", "name email")
      .populate("items.raw_material_id");
  }
  next();
});

export default mongoose.models.BOM || mongoose.model("BOM", BOMSchema);
