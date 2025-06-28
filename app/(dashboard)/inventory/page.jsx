import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getInventoryItems } from "@/actions/inventory";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";
import InventoryManagement from "./inventory-management.jsx";
import { ProduceProductsDialog } from "./components/produce-products-dialog";

export default async function InventoryPage() {
  await requirePageAccess({
    inventories: ["read"],
  });

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: [
      "inventory",
      { page: 1, limit: 10, itemType: "all", lowStock: false, searchTerm: "" },
    ],
    queryFn: () =>
      getInventoryItems({
        page: 1,
        limit: 10,
        itemType: "all",
        lowStock: false,
      }),
  });

  const perms = await createServerPermissionsFromCollection("inventories");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Inventory Management
        </h1>
        {perms.canWrite && (
          <ProduceProductsDialog
            queryKey={[
              "inventory",
              {
                page: 1,
                limit: 10,
                itemType: "all",
                lowStock: false,
                searchTerm: "",
              },
            ]}
          />
        )}
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <InventoryManagement perms={perms} />
      </HydrationBoundary>
    </div>
  );
}
