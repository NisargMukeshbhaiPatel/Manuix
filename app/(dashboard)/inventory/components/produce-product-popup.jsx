"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { produceProducts } from "@/actions/inventory";
import { createProductionDraft } from "@/actions/production-draft";

export function ProduceProductPopup({ open, setOpen, salesOrderId, productId, quantity, productName, productSku, onSuccess, queryKey }) {
  const [draftLoading, setDraftLoading] = useState(false);
  const [qty, setQty] = useState(quantity || "");
  const queryClient = useQueryClient();

  useEffect(() => {
    setQty(quantity || "");
  }, [quantity, productId]);

  const mutation = useMutation({
    mutationFn: ({ productId, quantity }) =>
      produceProducts({ productId, quantity: parseFloat(quantity) }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Production Successful",
          description: data.message,
        });
        queryClient.invalidateQueries({ queryKey });
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Production Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to produce products",
        variant: "destructive",
      });
    },
  });

  const handleDraft = async () => {
    if (!productId || !qty || parseFloat(qty) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    setDraftLoading(true);
    try {
      const res = await createProductionDraft({ productId, quantity: parseFloat(qty), salesOrderId });
      if (res.success) {
        toast({
          title: "Draft Created",
          description: res.message || "Production draft created successfully.",
        });
        queryClient.invalidateQueries({ queryKey });
        queryClient.invalidateQueries({ queryKey: ["productionDrafts"] });
        setOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: "Draft Creation Failed",
          description: res.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create production draft",
        variant: "destructive",
      });
    }
    setDraftLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId || !qty || parseFloat(qty) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ productId, quantity: qty });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Produce Product</DialogTitle>
          <DialogDescription>
            Confirm production for <span className="font-bold">{productName}</span> ({productSku}).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity to produce"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                disabled={mutation.isPending}
                min="1"
                step="1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              disabled={mutation.isPending || !productId || !qty}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Produce
            </Button>
            <Button
              type="button"
              disabled={draftLoading || !productId || !qty}
              onClick={handleDraft}
            >
              {draftLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
