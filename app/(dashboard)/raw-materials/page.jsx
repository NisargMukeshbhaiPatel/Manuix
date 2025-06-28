import requirePageAccess from "@/lib/requirePageAccess";
import dynamic from "next/dynamic";
import getQueryClient from "@/lib/query-client";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getRawMaterials } from "@/actions/raw-material";
import { createServerPermissionsFromCollection } from "@/lib/rbac";

import RawMaterialsPage from "./raw-materials-page";

export default async function Page() {
  await requirePageAccess({
    rawmaterials: ["read"],
  });
  const queryClient = getQueryClient();

  try {
    await queryClient.prefetchQuery({
      queryKey: ["rawMaterials", 1, ""],
      queryFn: () => getRawMaterials({ page: 1, name: "" }),
    });
  } catch (error) {
    return error.message;
  }

  const perms = await createServerPermissionsFromCollection("rawmaterials");

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RawMaterialsPage perms={perms} />
    </HydrationBoundary>
  );
}
