import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getProducts } from "@/actions/product";
import ProductsList from "./products-list.jsx";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";

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

  const perms = await createServerPermissionsFromCollection("products");
  const { canRead } = await createServerPermissionsFromCollection("boms");
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductsList perms={perms} fetchBom={canRead} />
    </HydrationBoundary>
  );
}
