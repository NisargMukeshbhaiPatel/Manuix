"use server"
import dbConnect from "@/lib/db";
import ProductionDraft from "@/models/ProductionDraft";

export async function getProductionDrafts() {
  await dbConnect();
  // Get all drafts, populate product and shortages
  return await ProductionDraft.find({})
    .populate("product_id")
    .populate("shortages.raw_material_id")
    .lean();
}
