import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getInventory } from "@/actions/inventory";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function InventoryPage() {
  await requirePageAccess({
    inventory: ["read"]
  });

  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: ["inventory"],
    queryFn: () => getInventory(),
  });
  console.log(await getInventory());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventory</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        INVENTORY
      </HydrationBoundary>
    </div>
  );
} 
