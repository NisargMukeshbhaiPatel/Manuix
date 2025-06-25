"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/separator";
import { Button } from "@/components/button";
import {
  Package,
  Calendar,
  User,
  DollarSign,
  List,
  Edit,
  Loader2,
  AlertCircle,
  Hash,
} from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getBOMs } from "@/actions/bom";
import { useRouter } from "next/navigation";

export default function ProductViewModal({ product, isOpen, onClose }) {
  const router = useRouter();

  const {
    data: bomData,
    isLoading: bomLoading,
    error: bomError,
  } = useQuery({
    queryKey: ["boms", product?._id],
    queryFn: () => getBOMs({ productId: product._id, limit: 100 }),
    enabled: !!product?._id && isOpen,
  });

  if (!product) return null;

  const handleEditBOM = () => {
    router.push(`/bom/edit/${product._id}`);
    onClose();
  };

  // Calculate total cost for a BOM
  const calculateBOMCost = (items) => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      const price = item.raw_material?.price || 0;
      const quantity = item.quantity || 0;
      return total + price * quantity;
    }, 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
            <p className="leading-relaxed">{product.description}</p>
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
                  <p className="text-sm">{product.unit}</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Created By</p>
                  <p className="text-sm">{product.created_by}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-sm font-medium">Product ID</p>
                  <p className="text-sm font-mono">{product._id}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* BOM Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <List className="h-4 w-4" />
                Bill of Materials (BOM)
              </h3>
              {bomData?.boms && bomData.boms.length > 0 && (
                <Button
                  onClick={handleEditBOM}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit BOM
                </Button>
              )}
            </div>

            {bomLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading BOM details...</span>
              </div>
            )}

            {bomError && (
              <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">
                  Failed to load BOM details
                </span>
              </div>
            )}

            {bomData && bomData.success && (
              <div className="space-y-3">
                {bomData.boms && bomData.boms.length > 0 ? (
                  <div className="grid gap-4">
                    {bomData.boms.map((bom) => (
                      <div key={bom._id}>
                        <div className="space-y-2">
                          {/* Raw Materials/Components List */}
                          {bom.items && bom.items.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                Raw Materials
                              </h5>
                              <div className="space-y-2">
                                {bom.items.map((item) => (
                                  <div
                                    key={item._id}
                                    className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm">
                                          {item.raw_material?.name ||
                                            "Unknown Material"}
                                        </span>
                                        <Badge
                                          variant="secondary"
                                          className="text-xs"
                                        >
                                          {item.raw_material?.unit || "unit"}
                                        </Badge>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="flex items-center gap-2">
                                        <div className="text-sm">
                                          <Hash className="h-3 w-3 inline mr-1" />
                                          {item.quantity}
                                        </div>
                                        <div className="font-semibold text-sm">
                                          {formatPrice(
                                            (item.raw_material?.price || 0) *
                                              item.quantity,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="font-semibold text-primary text-right">
                                Total:{" "}
                                {formatPrice(calculateBOMCost(bom.items))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      No BOM records found for this product
                    </p>
                    <Button
                      onClick={() => router.push("/bom/create")}
                      size="sm"
                      variant="outline"
                      className="mt-3"
                    >
                      Create BOM
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Created At</p>
              <p>{formatDate(product.createdAt)}</p>
            </div>
            <div>
              <p className="font-medium">Last Updated</p>
              <p>{formatDate(product.updatedAt)}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
