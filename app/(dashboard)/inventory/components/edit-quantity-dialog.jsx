"use client";

import { useState, useTransition } from "react";
import getQueryClient from "@/lib/query-client";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Loader2, Edit } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { updateInventory } from "@/actions/inventory";

export function EditQuantityDialog({
  item,
  queryKey,
  title = "Edit Quantity",
  variant = "outline",
  size = "sm",
}) {
  const queryClient = getQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState("");
  const [operation, setOperation] = useState("add");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!quantity || isNaN(Number(quantity))) {
      toast({
        title: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const result = await updateInventory({
          itemType: item.item_type,
          itemId: item.item.id,
          quantity: Number(quantity),
          operation:
            operation === "add"
              ? "add"
              : operation === "subtract"
                ? "remove"
                : "set",
        });

        if (result.success) {
          setIsOpen(false);
          setQuantity("");
          queryClient.invalidateQueries({ queryKey });
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        console.error(error);
        toast({
          title: error.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Update quantity for {item.item.name} (Current: {item.quantity})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <div className="flex">
                <Button
                  type="button"
                  variant={operation === "add" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOperation("add")}
                  className="flex items-center gap-2"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant={operation === "subtract" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOperation("subtract")}
                  className="flex items-center gap-2"
                >
                  Subtract
                </Button>
                <Button
                  type="button"
                  variant={operation === "set" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setOperation("set")}
                  className="flex items-center gap-2"
                >
                  Set
                </Button>
              </div>
            </div>
            <div className="grid gap-2">
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={
                  operation === "set" ? "Enter new quantity" : "Enter quantity"
                }
                min="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
