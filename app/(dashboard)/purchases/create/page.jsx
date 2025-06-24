import requirePageAccess from "@/lib/requirePageAccess";
import CreatePurchaseOrderForm from "./create-purchase-order-form";

export default async function CreatePurchaseOrderPage() {
  await requirePageAccess({
    purchaseorders: ["create"],
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Create Purchase Order
        </h1>
        <p className="text-muted-foreground">
          Create a new purchase order for raw materials
        </p>
      </div>

      <CreatePurchaseOrderForm />
    </div>
  );
}
