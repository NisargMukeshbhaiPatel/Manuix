import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getPurchaseOrders } from "@/actions/purchase-order";
import requirePageAccess from "@/lib/requirePageAccess";
import PurchaseOrders from "./purchase-orders-page";

export default async function PurchaseOrdersPage() {
  await requirePageAccess({
    purchaseorders: ["read"],
  });

  const queryClient = getQueryClient();

  const defaultFilters = {
    page: 1,
    status: null,
    startDate: null,
    endDate: null,
    search: "",
  };
  // Use the same query key pattern as the client
  await queryClient.prefetchQuery({
    queryKey: [
      "purchase-orders",
      1,
      {
        status: "all",
        startDate: "",
        endDate: "",
        search: "",
      },
    ],
    queryFn: () => getPurchaseOrders(defaultFilters),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl md:text-2xl font-bold">Purchase Orders</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PurchaseOrders />
      </HydrationBoundary>
    </div>
  );
}
