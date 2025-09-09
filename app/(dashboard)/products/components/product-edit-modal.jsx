"use client";
import { useState, useEffect } from "react";
import { updateProduct } from "@/actions/product";
import getQueryClient from "@/lib/query-client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/dialog";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import { Package, Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function ProductEditModal({
  product,
  isOpen,
  onClose,
  queryKey,
}) {
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "",
    price: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = getQueryClient();

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description,
        unit: product.unit,
        price: product.price,
      });
    }
  }, [product]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await updateProduct(product._id, formData);
      if (!data.success) throw new Error(data.error);
      toast({
        title: "Product updated",
      });
      queryClient.setQueryData(queryKey, (oldData) => {
        return {
          ...oldData,
          data: oldData.data.map((p) =>
            p._id === data.product._id ? data.product : p,
          ),
        };
      });

      onClose();
    } catch (error) {
      console.error(error);
      toast({
        title: error.message || "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Edit Product
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="">
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter SKU"
                required
              />
            </div>
          </div>

          <div className="">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="price"
                type="text"
                value={formData.unit}
                onChange={(e) => handleInputChange("unit", e.target.value)}
                placeholder="e.g Piece/Kg/L"
                required
              />
            </div>

            <div className="">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  handleInputChange(
                    "price",
                    parseInt(e.target.value) || 0,
                  )
                }
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <Save className="h-4 w-4 mr-1" />
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
