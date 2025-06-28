"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import getQueryClient from "@/lib/query-client";
import { useMutation } from "@tanstack/react-query";
import { Eye, Edit, Trash2, DollarSign, Calendar, Hash } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { deleteBOM } from "@/actions/bom";
import { getInitials, formatDate } from "@/lib/utils";

export function BOMCard({ bom, onView, onSuccess, perms }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = getQueryClient();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteBOM(bom._id);
      if (result.success) {
        toast({
          title: "Product deleted",
        });
        queryClient.setQueryData("boms", (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: oldData.data.filter((b) => b._id !== bom._id),
          };
        });
        onSuccess();
      } else {
        throw new Error(result.error);
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

  const totalCost = bom.items.reduce((sum, item) => {
    return sum + item.quantity * item.raw_material.price;
  }, 0);

  const totalComponents = bom.items.length;

  const handleEdit = () => {
    // Navigate to edit page instead of opening modal
    router.push(`/bom/edit/${bom._id}`);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg">{bom.product.name}</CardTitle>
            <Badge className="text-xs">{bom.product.sku}</Badge>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              ${bom.product.price.toFixed(2)}
            </div>
            <div className="text-xs text-muted-foreground">
              per {bom.product.unit}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Hash className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">{totalComponents}</div>
              <div className="text-xs text-muted-foreground">
                {totalComponents > 1 ? "Materials" : "Material"}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium">${totalCost.toFixed(2)}</div>
              <div className="text-xs text-muted-foreground">Total Cost</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <div className="text-xs">Created {formatDate(bom.createdAt)}</div>
            </div>
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <div className="text-xs">Updated {formatDate(bom.updatedAt)}</div>
            </div>
          </div>

          {/* Creator Avatar with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="cursor-help">
                  <AvatarFallback className="text-xs">
                    {getInitials(bom.creator.name)}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">{bom.creator.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {bom.creator.email}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>

      <CardFooter className="mt-auto gap-4 mt-auto flex flex-wrap">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => onView(bom)}
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        {perms?.canEdit && (
          <Button size="sm" className="flex-1" onClick={handleEdit}>
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
        {perms?.canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                className="flex-1"
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete BOM</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete the BOM for "{bom.product.name}
                  "? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
}
