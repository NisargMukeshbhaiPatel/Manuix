"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/separator";
import { Package, Calendar, User, DollarSign } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";

export default function ProductViewModal({ product, isOpen, onClose }) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <Badge variant="outline" className="w-fit">
                SKU: {product.sku}
              </Badge>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {formatPrice(product.price)}
              </div>
              <Badge variant="secondary">per {product.unit}</Badge>
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-semibold">Description</h3>
            <p className="leading-relaxed">
              {product.description}
            </p>
          </div>

          <Separator />

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <DollarSign className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Price</p>
                  <p className="text-sm">
                    {formatPrice(product.price)} per {product.unit}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Package className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Unit</p>
                  <p className="text-sm">
                    {product.unit}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-sm">
                    {product.created_by}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Product ID</p>
                  <p className="text-sm font-mono">
                    {product._id}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Created At</p>
              <p>
                {formatDate(product.createdAt)}
              </p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p>
                {formatDate(product.updatedAt)}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
