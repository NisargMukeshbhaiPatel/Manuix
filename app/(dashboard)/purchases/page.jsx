import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getPurchaseOrders } from "@/actions/purchase-order";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function PurchaseOrdersPage() {
  await requirePageAccess({
    purchase_orders: ["read"]
  });

  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: ["purchaseOrders"],
    queryFn: () => getPurchaseOrders(),
  });
  console.log(await getPurchaseOrders());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Purchase Orders</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        PURCHASE ORDERS
      </HydrationBoundary>
    </div>
  );
} 
