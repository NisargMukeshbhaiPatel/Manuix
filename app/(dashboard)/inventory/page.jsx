import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getInventoryItems } from "@/actions/inventory";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";
import InventoryManagement from "./inventory-management.jsx";
import { ProduceProductsDialog } from "./components/produce-products-dialog";
import Link from "next/link";
import { Package } from "lucide-react";
import { Button } from "@/components/button";
import { getProductionDrafts } from "@/actions/production-draft";
import { getSalesOrders } from "@/actions/sales-order";

export default async function InventoryPage() {
  await requirePageAccess({
    inventories: ["read"],
  });

  const queryClient = getQueryClient();

  // Prefetch inventory items
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

  // Prefetch sales orders (draft status)
  await queryClient.prefetchQuery({
    queryKey: ["salesOrders", 1],
    queryFn: () => getSalesOrders({ page: 1, limit: 5, status: "draft" }),
  });

  // Prefetch production drafts
  await queryClient.prefetchQuery({
    queryKey: ["productionDrafts"],
    queryFn: getProductionDrafts,
  });

  const perms = await createServerPermissionsFromCollection("inventories");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
          Inventory Management
        </h1>
        <div className="flex items-center gap-2">
          <Link href="/production-drafts">
            <Button variant="outline" size="sm" className="gap-2">
              <Package className="h-4 w-4" />
              View Production Drafts
            </Button>
          </Link>
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
      </div>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <InventoryManagement perms={perms} />
      </HydrationBoundary>
    </div>
  );
}
