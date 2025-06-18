import { getQueryClient } from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getRawMaterials } from "@/actions/raw-material";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function RawMaterialsPage() {
  // Protect the page with appropriate permissions
  await requirePageAccess({
    raw_materials: ["read"]
  });

  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: ["rawMaterials"],
    queryFn: () => getRawMaterials(),
  });
  console.log(await getRawMaterials)


  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Raw Materials</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        RAW MATERIALS
      </HydrationBoundary>
    </div>
  );
}