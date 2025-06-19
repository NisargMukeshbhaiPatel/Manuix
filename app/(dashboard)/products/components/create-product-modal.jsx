"use client";

import { useState } from "react";
import getQueryClient from "@/lib/query-client";
import Link from "next/link";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Save, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { createProduct } from "@/actions/product";
import { useQueryClient } from "@tanstack/react-query";

export default function CreateProductModal({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    unit: "",
    price: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      description: "",
      unit: "",
      price: 0,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await createProduct(formData);
      if (!result.success) {
        throw new Error(result.error);
      }
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({
        title: "Product created",
      });
      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            New Product
          </DialogTitle>
        </DialogHeader>

        {/* Main CTA for creating with BOM */}
        <div className="mb-4">
          <Link href="/bom/create">
            <Button
              type="button"
              className="w-full"
              disabled={isLoading}
              onClick={handleClose}
            >
              Create Product with BOM
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Recommended: Create a complete product with BOM (can be added later
            as well)
          </p>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t-2" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or create product only
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Product Name *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter product name"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-sku">SKU *</Label>
              <Input
                id="create-sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder="Enter unique SKU"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="create-description">Description *</Label>
            <Textarea
              id="create-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Enter product description"
              rows={3}
              required
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="create-price">Price ($) *</Label>
              <Input
                id="create-price"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.price || ""}
                onChange={(e) =>
                  handleInputChange(
                    "price",
                    Number.parseFloat(e.target.value) || 0,
                  )
                }
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              type="submit"
              variant="outline"
              className="w-full"
              disabled={isLoading}
            >
              <Save className="h-4 w-4" />
              {isLoading ? "Creating..." : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
