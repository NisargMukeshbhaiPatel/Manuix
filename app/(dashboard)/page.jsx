import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function Dashboard() {
// NOTE: don't use requirePageAccess as this route is the fallback
  const queryClient = getQueryClient();

  // await queryClient.prefetchQuery({
  //   queryKey: ["rawMaterials"],
  //   queryFn: () => getRawMaterials(),
  // });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {/* <HydrationBoundary state={dehydrate(queryClient)}></HydrationBoundary> */}
    </div>
  );
}
