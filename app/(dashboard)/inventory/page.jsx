import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getInventoryItems } from "@/actions/inventory";
import requirePageAccess from "@/lib/requirePageAccess";
import InventoryManagement from "./inventory-management.jsx";

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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Inventory Management
        </h1>
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <InventoryManagement />
      </HydrationBoundary>
    </div>
  );
}
