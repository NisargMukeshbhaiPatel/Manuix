import mongoose from "mongoose";
import Product from "@/models/Product";
import User from "@/models/User";

const ProductionDraftSchema = new mongoose.Schema({
  product_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.modelName,
    required: true,
    index: true,
  },
  quantity: {
    type: mongoose.Schema.Types.Decimal128,
    required: true,
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User.modelName,
    required: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});


export default mongoose.models.ProductionDraft || mongoose.model("ProductionDraft", ProductionDraftSchema);
