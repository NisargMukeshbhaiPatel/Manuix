import ProductionDraft from "@/models/ProductionDraft";

export async function getProductionDrafts() {
  // Get all drafts, populate product and shortages
  return await ProductionDraft.find({})
    .populate("product_id")
    .populate("shortages.raw_material_id")
    .lean();
}
