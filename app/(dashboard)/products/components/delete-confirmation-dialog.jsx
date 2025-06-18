"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import getQueryClient from "@/lib/query-client";
import { deleteProduct } from "@/actions/product";

export default function DeleteConfirmationDialog({
  product,
  isOpen,
  onClose,
  queryKey,
}) {
  const queryClient = getQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!product) return;
    setIsDeleting(true);
    try {
      const result = await deleteProduct(product._id);
      if (result.success) {
        toast({
          title: "Product deleted",
        });
        queryClient.setQueryData(queryKey, (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: oldData.data.filter((p) => p._id !== product._id),
          };
        });
        onClose();
      } else {
        toast({
          title: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: error.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (!product) return null;
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Product
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            Are you sure you want to delete {product.name}? This action cannot
            be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? "Deleting..." : "Delete Product"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
