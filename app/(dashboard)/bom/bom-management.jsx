"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/card";
import { Skeleton } from "@/components/skeleton";
import { Button } from "@/components/button";
import { BOMCard } from "./components/bom-card";
import { BOMDetailModal } from "./components/bom-detail-modal";
import { BOMPagination } from "./components/bom-pagination";
import { getBOMs } from "@/actions/bom";
import { useRouter } from "next/navigation";

export default function BOMManagementPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBOM, setSelectedBOM] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const queryClient = getQueryClient();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["boms", currentPage],
    queryFn: () => getBOMs(currentPage),
  });

  const handleView = (bom) => {
    setSelectedBOM(bom);
    setIsDetailModalOpen(true);
  };

  const handleCreate = () => {
    router.push("/bom/create");
  };

  const handleModalClose = () => {
    setSelectedBOM(null);
    setIsDetailModalOpen(false);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["boms"] });
    handleModalClose();
  };

  if (isLoading) {
    return (
      <div className="mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="border border-muted-background rounded-md" key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-3 pt-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex gap-3 pb-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-9 w-full" />
                    <Skeleton className="h-9 w-full" />
                  </div>
                </div>
              </CardContent>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-destructive">
            Error loading BOMs. Please try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {data?.boms.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No BOMs found</p>
          <Button onClick={handleCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first BOM
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {data?.boms.map((bom) => (
              <BOMCard
                key={bom._id}
                bom={bom}
                onView={handleView}
                onSuccess={handleSuccess}
              />
            ))}
          </div>

          <BOMPagination
            currentPage={currentPage}
            totalPages={data?.totalPages || 1}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      <BOMDetailModal
        bom={selectedBOM}
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
      />
    </div>
  );
}
