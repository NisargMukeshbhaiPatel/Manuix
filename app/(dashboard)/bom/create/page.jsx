import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getProductsWithoutBOM } from "@/actions/product";
import { getRawMaterials } from "@/actions/raw-material";
import CreateBOMForm from "./create-bom-form.jsx";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function CreateBOMPage() {
  await requirePageAccess({
    boms: ["create"],
    // products: ["read"], //idk doesn't make sense?
    // raw_materials: ["read"],
  });

  const queryClient = getQueryClient();

  let products;
  try {
    // Prefetch raw materials
    const res = await getProductsWithoutBOM();
    if (!res.success) throw new Error(res.error);
    products = res.data;

    await queryClient.prefetchQuery({
      queryKey: ["raw-materials"],
      queryFn: getRawMaterials,
    });
    // Prefetch products without BOM
    await queryClient.prefetchQuery({
      queryKey: ["products-without-bom"],
      queryFn: getProductsWithoutBOM,
    });
  } catch (error) {
    return error.message;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreateBOMForm products={products} />
    </HydrationBoundary>
  );
}
