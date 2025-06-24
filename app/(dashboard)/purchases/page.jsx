import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getPurchaseOrders } from "@/actions/purchase-order";
import requirePageAccess from "@/lib/requirePageAccess";
import PurchaseOrders from "./purchase-orders-page";
import { Button } from "@/components/button";
import { Plus, Package } from "lucide-react";
import Link from "next/link";

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
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold">Purchase Orders</h1>
        <div className="flex items-center gap-2">
          <Link href="/raw-materials">
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              Manage Raw Materials
            </Button>
          </Link>
          <Link href="/purchases/create">
            <Button variant="default" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Purchase Order
            </Button>
          </Link>
        </div>
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <PurchaseOrders />
      </HydrationBoundary>
    </div>
  );
}
