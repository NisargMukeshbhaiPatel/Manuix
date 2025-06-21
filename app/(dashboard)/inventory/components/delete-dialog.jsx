import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/button";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { deleteInventoryItem } from "@/actions/inventory";
import { toast } from "@/hooks/use-toast";

export function DeleteDialog({ item, queryKey }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = getQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast({
        title: "Item deleted successfully",
      });
      setIsOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate(item._id);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {item.item.name}? This action cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
