import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getProducts } from "@/actions/product";
import ProductsTable from "./components/products-table.jsx";

export default async function ProductsPage() {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["products", 1, ""],
    queryFn: () => getProducts({ page: 1, name: "" }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsTable />
    </HydrationBoundary>
  );
}
