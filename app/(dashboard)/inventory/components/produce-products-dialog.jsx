"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { toast } from "@/hooks/use-toast";
import { Factory, Loader2 } from "lucide-react";

import { produceProducts } from "@/actions/inventory";
import { getProducts } from "@/actions/product";
import { createProductionDraft } from "@/actions/production-draft";

export function ProduceProductsDialog({ queryKey }) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const queryClient = useQueryClient();

  // Fetch products for the dropdown
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", { page: 1, limit: 100 }],
    queryFn: () => getProducts({ page: 1, limit: 100 }),
    enabled: open, // Only fetch when dialog is open
  });

  const draftMutation = useMutation({
    mutationFn: ({ productId, quantity }) =>
      createProductionDraft({ productId, quantity: parseFloat(quantity) }),
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Draft Created",
          description: data.message || "Production draft created successfully.",
        });
        queryClient.invalidateQueries({ queryKey });
        setOpen(false);
        setProductId("");
        setQuantity("");
      } else {
        toast({
          title: "Draft Creation Failed",
          description: data.message,
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create production draft",
        variant: "destructive",
      });
    },
  });

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
        setProductId("");
        setQuantity("");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!productId || !quantity || parseFloat(quantity) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({ productId, quantity });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm" className="gap-2">
          <Factory className="h-4 w-4" />
          Produce Products
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Produce Products</DialogTitle>
          <DialogDescription>
            Select a product and quantity to produce. Raw materials will be consumed based on the product's BOM.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={productId}
                onValueChange={setProductId}
                disabled={productsLoading || mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>                <SelectContent>
                  {productsLoading ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Loading products...
                    </div>
                  ) : productsData?.data && productsData.data.length > 0 ? (
                    productsData.data.map((product) => (
                      <SelectItem key={product._id} value={product._id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      No products available
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity to produce"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={mutation.isPending}
                min="1"
                step="1"
              />
            </div>
          </div>
          <DialogFooter>

            <Button
              type="submit"
              disabled={mutation.isPending || !productId || !quantity}
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Produce
            </Button>
            <Button
              type="button"
              disabled={draftMutation.isPending || !productId || !quantity}
              onClick={() => {
                if (!productId || !quantity || parseFloat(quantity) <= 0) {
                  toast({
                    title: "Validation Error",
                    description: "Please select a product and enter a valid quantity",
                    variant: "destructive",
                  });
                  return;
                }
                draftMutation.mutate({ productId, quantity });
              }}
            >
              {draftMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Draft
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={mutation.isPending || draftMutation.isPending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
