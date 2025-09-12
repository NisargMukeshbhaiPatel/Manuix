"use server"
import dbConnect from "@/lib/db";
import ProductionDraft from "@/models/ProductionDraft";

// Create a new production draft
export async function createProductionDraft({ productId, quantity, createdBy, salesOrderId }) {
  await dbConnect();
  const ProductionDraft = (await import("@/models/ProductionDraft")).default;
  const draft = new ProductionDraft({
    product_id: productId,
    sales_order_id: salesOrderId || null,
    quantity,
    created_by: createdBy || null,
    created_at: new Date(),
  });
  await draft.save();
  return { success: true, message: "Production draft created successfully.", draftId: draft._id.toString() };
}

// Delete a production draft by ID
export async function deleteProductionDraft(draftId) {
  await dbConnect();
  const result = await ProductionDraft.deleteOne({ _id: draftId });
  if (result.deletedCount === 0) {
    throw new Error("Draft not found or already deleted");
  }
  return { success: true };
}
// Update the quantity of a production draft
export async function updateProductionDraftQuantity(draftId, quantity) {
  await dbConnect();
  const draft = await ProductionDraft.findById(draftId);
  if (!draft) throw new Error("Draft not found");
  draft.quantity = quantity;
  await draft.save();
  return { success: true };
}

export async function getProductionDrafts() {
  await dbConnect();
  const drafts = await ProductionDraft.find({})
    .populate("product_id")
    .lean();

  // For each draft, use product instance's getBOM method
  const Inventory = (await import("@/models/Inventory")).default;
  const Product = (await import("@/models/Product")).default;

  const enrichedDrafts = await Promise.all(drafts.map(async draft => {
    // Get product instance
    const productInstance = await Product.findById(draft.product_id?._id || draft.product_id);
    let requiredMaterials = [];
    if (productInstance && typeof productInstance.getBOM === "function") {
      const bomDoc = await productInstance.getBOM();
      if (bomDoc && bomDoc.items) {
        requiredMaterials = await Promise.all(bomDoc.items.map(async item => {
          const materialId = item.raw_material_id?._id?.toString() || item.raw_material_id?.toString();
          // Get current inventory for this raw material
          const currentStock = await Inventory.getStockLevel("raw_material", materialId);
          // Calculate total required quantity for this draft
          const itemRequired = parseFloat(item.quantity?.toString() || "0");
          const draftQuantity = parseFloat(draft.quantity?.toString() || "1");
          const totalRequired = itemRequired * draftQuantity;
          return {
            _id: materialId,
            name: item.raw_material_id?.name,
            unit: item.raw_material_id?.unit,
            price: item.raw_material_id?.price?.toString(),
            required: itemRequired,
            totalRequired,
            available: currentStock,
          };
        }));
      }
    }

    return {
      ...draft,
      _id: draft._id?.toString(),
      product_id: draft.product_id?._id?.toString() || draft.product_id?.toString(),
      sales_order_id: draft.sales_order_id ? draft.sales_order_id.toString() : null,
      created_by: draft.created_by?.toString(),
      quantity: draft.quantity?.toString(),
      created_at: draft.created_at instanceof Date ? draft.created_at.toISOString() : draft.created_at,
      product: draft.product_id && typeof draft.product_id === 'object' ? {
        ...draft.product_id,
        _id: draft.product_id._id?.toString(),
        price: draft.product_id.price?.toString(),
        created_by: draft.product_id.created_by?.toString(),
      } : undefined,
      requiredMaterials,
    };
  }));
  return enrichedDrafts;
}

// Produce a production draft: consume inventory and mark as produced
export async function produceProductionDraft(draftId) {
  await dbConnect();
  const draft = await ProductionDraft.findById(draftId);
  if (!draft) throw new Error("Draft not found");

  const Inventory = (await import("@/models/Inventory")).default;
  // Use Inventory.produceProducts to handle production and inventory
  const result = await Inventory.produceProducts(draft.product_id, parseFloat(draft.quantity || "1"));

  //delete the draft after production
  await ProductionDraft.deleteOne({ _id: draftId });
  return { success: true, message: "Production draft produced and inventory updated.", ...result };
}
