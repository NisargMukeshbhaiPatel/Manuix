import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getBOMs } from "@/actions/bom";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function BOMPage() {
  await requirePageAccess({
    boms: ["read"]
  });

  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: ["boms"],
    queryFn: () => getBOMs(),
  });
  console.log(await getBOMs());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bill of Materials</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        BILL OF MATERIALS
      </HydrationBoundary>
    </div>
  );
} 
