import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getFinance } from "@/actions/finance";
import requirePageAccess from "@/lib/requirePageAccess";

export default async function FinancePage() {
  await requirePageAccess({
    finances: ["read"]
  });

  const queryClient = getQueryClient();
  
  await queryClient.prefetchQuery({
    queryKey: ["finance"],
    queryFn: () => getFinance(),
  });
  console.log(await getFinance());

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Finance</h1>
      <HydrationBoundary state={dehydrate(queryClient)}>
        FINANCE
      </HydrationBoundary>
    </div>
  );
} 
