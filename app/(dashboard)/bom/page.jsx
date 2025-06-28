import getQueryClient from "@/lib/query-client";
import { Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/button";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getBOMs } from "@/actions/bom";
import requirePageAccess from "@/lib/requirePageAccess";
import { createServerPermissionsFromCollection } from "@/lib/rbac";
import BOMManagementPage from "./bom-management";

export default async function BOMPage() {
  await requirePageAccess({
    boms: ["read"],
  });

  const queryClient = getQueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["boms", 1],
    queryFn: () => getBOMs(1),
  });

  const perms = await createServerPermissionsFromCollection("boms");

  return (
    <div className="space-y-4">
      <div className="md:flex justify-between items-center mb-6">
        <h1 className="text-xl md:text-2xl font-bold">Bill of Materials</h1>
        {perms.canWrite && (
          <Link href="/bom/create">
            <Button>
              <Plus className="w-4 h-4" />
              Create BOM
            </Button>
          </Link>
        )}
      </div>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <BOMManagementPage perms={perms} />
      </HydrationBoundary>
    </div>
  );
}
