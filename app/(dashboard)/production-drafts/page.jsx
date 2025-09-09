import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getProductionDrafts } from "@/actions/production-draft";
import ProductionDraftsList from "./production-drafts-list";

import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";

export default async function ProductionDraftsPage() {
  // TODO: For perms
  // await requirePageAccess({
  //   "production-drafts": ["read"],
  // });

  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["production-drafts"],
      queryFn: getProductionDrafts,
    });
  } catch (error) {
    return <div className="text-red-600">Error: {error.message}</div>;
  }

  // const perms =
  //   await createServerPermissionsFromCollection("production-drafts");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductionDraftsList />
    </HydrationBoundary>
  );
}
