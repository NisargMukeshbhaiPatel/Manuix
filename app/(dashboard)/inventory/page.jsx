import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getInventoryItems } from "@/actions/inventory";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function InventoryPage() {
  await requirePageAccess({
    inventories: ["read"],
  });

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventoryItems(),
  });
  console.log(await getInventoryItems());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        INVENTORY
      </HydrationBoundary>
    </div>
  );
}
