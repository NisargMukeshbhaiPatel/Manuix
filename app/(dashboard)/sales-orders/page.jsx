import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getSalesOrders } from "@/actions/sales-order";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";
import SalesOrdersPage from "./sales-order-page";

export default async function SalesOrdersServerPage() {
  await requirePageAccess({
    salesorders: ["read"],
  });

  const queryClient = getQueryClient();

  const defaultPage = 1;
  const defaultFilters = {
    status: "all",
    customerName: "",
    startDate: "",
    endDate: "",
    search: "",
  };

  await queryClient.prefetchQuery({
    queryKey: ["salesOrders", defaultPage, defaultFilters],
    queryFn: () =>
      getSalesOrders({
        page: defaultPage,
        status: defaultFilters.status === "all" ? null : defaultFilters.status,
        customerName:
          defaultFilters.customerName || defaultFilters.search || null,
        startDate: defaultFilters.startDate || null,
        endDate: defaultFilters.endDate || null,
      }),
  });

  const perms = await createServerPermissionsFromCollection("salesorders");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SalesOrdersPage perms={perms} />
    </HydrationBoundary>
  );
}
