import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getSalesOrders } from "@/actions/sales-order";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function SalesOrdersPage() {
  // Protect the page with appropriate permissions
  await requirePageAccess({
    salesorders: ["read"]
  });

  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: ["salesOrders"],
    queryFn: () => getSalesOrders(),
  });
  console.log(await getSalesOrders());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Sales Orders</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        SALES ORDERS
      </HydrationBoundary>
    </div>
  );
} 
