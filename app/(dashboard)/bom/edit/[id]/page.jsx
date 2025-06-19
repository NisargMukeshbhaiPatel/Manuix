import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getBOMById } from "@/actions/bom";
import { getRawMaterials } from "@/actions/raw-material";
import EditBOMForm from "./edit-bom-form.jsx";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function EditBOMPage({ params }) {
  await requirePageAccess({
    boms: ["update"],
  });

  const { id: bomId } = params;
  const queryClient = getQueryClient();

  try {
    // Prefetch BOM data
    await queryClient.prefetchQuery({
      queryKey: ["bom", bomId],
      queryFn: () => getBOMById(bomId),
    });

    // Prefetch raw materials
    await queryClient.prefetchQuery({
      queryKey: ["raw-materials"],
      queryFn: getRawMaterials,
    });
  } catch (error) {
    return error.message;
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EditBOMForm />
    </HydrationBoundary>
  );
}
