import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getProducts } from "@/actions/product";
import ProductsTable from "./components/products-table.jsx";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function ProductsPage() {
  await requirePageAccess({
    products: ["read"],
  });
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["products", 1, ""],
      queryFn: () => getProducts({ page: 1, name: "" }),
    });
  } catch (error) {
    return error.message;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsTable />
    </HydrationBoundary>
  );
}
