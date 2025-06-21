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

  try {
    await queryClient.prefetchQuery({
      queryKey: ["raw-materials"],
      queryFn: getRawMaterials,
    });
    await queryClient.prefetchQuery({
      queryKey: ["products-without-bom"],
      queryFn: getProductsWithoutBOM,
    });
  } catch (error) {
    return error.message;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CreateBOMForm />
    </HydrationBoundary>
  );
}
