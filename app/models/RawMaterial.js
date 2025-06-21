import mongoose from "mongoose";
import User from "@/models/User";

const RawMaterialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide a material name"],
      maxlength: [100, "Material name cannot be more than 100 characters"],
      index: true,
    },
    unit: {
      type: String,
      required: [true, "Please provide a unit of measurement"],
      trim: true,
    },
    price: {
      type: mongoose.Schema.Types.Decimal128,
      required: [true, "Please provide a default purchase price"],
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: User.modelName,
      required: [true, "Creator reference is required"],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function(doc, ret) {
        ret._id = ret._id.toString();
        delete ret.__v;

        if (ret.price) {
          ret.price = parseFloat(ret.price.toString());
        }

        // if (ret.reated_by && typeof ret.created_by === 'object' && ret.created_by._id) {
        //   ret.creator = {
        //     id: ret.created_by._id.toString(),
        //     name: ret.created_by.name,
        //     email: ret.created_by.email
        //   };
        //   ret.created_by = ret.created_by._id.toString();
        // } else {
          ret.created_by = ret.created_by.toString();
        // }
        //
        return ret;
      }
    },
    toObject: { getters: true },
  }
);

// Name already has index:true in schema definition, so no need for additional index

// Virtual field to handle decimal display since Decimal128 can sometimes be tricky in JavaScript
RawMaterialSchema.virtual('priceDecimal').get(function() {
  return this.price ? parseFloat(this.price.toString()) : 0;
});

// Method to check if this raw material is used in BOMs
RawMaterialSchema.methods.isUsedInBOM = async function() {
  const BOM = mongoose.models.BOM;
  if (!BOM) return false;
  
  // Check if any BOM items reference this raw material
  const count = await BOM.countDocuments({
    'items.raw_material_id': this._id
  });
  
  return count > 0;
};

// Method to check if this raw material has inventory and return the current level
RawMaterialSchema.methods.getInventoryLevel = async function() {
  const Inventory = mongoose.models.Inventory;
  if (!Inventory) return 0;
  
  // Use the static method from Inventory model
  return await Inventory.getStockLevel('raw_material', this._id);
};

// Method to list all BOMs that use this raw material
RawMaterialSchema.methods.getUsedInBOMs = async function() {
  const BOM = mongoose.models.BOM;
  if (!BOM) return [];
  
  const boms = await BOM.find({
    'items.raw_material_id': this._id
  }).populate('product_id');
  
  return boms;
};

export default mongoose.models.RawMaterial || mongoose.model("RawMaterial", RawMaterialSchema);
