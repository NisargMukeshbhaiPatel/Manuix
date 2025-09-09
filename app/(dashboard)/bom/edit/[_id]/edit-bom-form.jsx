"use client";

import { Textarea } from "@/components/textarea";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import {
  ArrowLeft,
  Plus,
  Search,
  Package,
  ShoppingCart,
  Save,
  User,
  Trash2,
  Minus,
} from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Badge } from "@/components/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { Avatar, AvatarFallback } from "@/components/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/tooltip";
import { Skeleton } from "@/components/skeleton";
import { updateBOM, getBOMById } from "@/actions/bom";
import { createRawMaterial, getRawMaterials } from "@/actions/raw-material";
import { formatDate, formatPrice } from "@/lib/utils";

export default function EditBOMTable() {
  const router = useRouter();
  const params = useParams();
  const queryClient = getQueryClient();
  const bomId = params._id;
  // prefetched
  const { data: bomData, isLoading: bomLoading } = useQuery({
    queryKey: ["bom", bomId],
    queryFn: () => getBOMById(bomId),
  });
  const bom = bomData?.success ? bomData.data : [];

  const [productData, setProductData] = useState(bom.product);
  const [bomItems, setBomItems] = useState(bom.items);
  const { data: response = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: getRawMaterials,
  });
  const rawMaterials = response?.success ? response.data : [];

  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);

  // New material form
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    price: 0,
    unit: "piece",
  });

  const updateBOMMutation = useMutation({
    mutationFn: ({ id, data, product }) => updateBOM(id, data, product),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["bom", bomId] });
      await queryClient.invalidateQueries({ queryKey: ["boms"] });
      router.push("/bom");
    },
  });

  const createMaterialMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      setNewMaterial({ name: "", price: 0, unit: "piece" });
      setIsNewMaterialModalOpen(false);
    },
  });

  const filteredMaterials = rawMaterials.filter((material) =>
    material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()),
  );

  const addMaterialToBOM = (material) => {
    const existingItem = bomItems.find(
      (item) => item.raw_material_id === material._id,
    );
    if (existingItem) {
      setBomItems((prev) =>
        prev.map((item) =>
          item.raw_material_id === material._id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setBomItems((prev) => [
        ...prev,
        { raw_material_id: material._id, raw_material: material, quantity: 1 },
      ]);
    }
  };

  const updateItemQuantity = (materialId, quantity) => {
    if (quantity <= 0) {
      setBomItems((prev) =>
        prev.filter((item) => item.raw_material_id !== materialId),
      );
    } else {
      setBomItems((prev) =>
        prev.map((item) =>
          item.raw_material_id === materialId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const removeItem = (materialId) => {
    setBomItems((prev) =>
      prev.filter((item) => item.raw_material_id !== materialId),
    );
  };

  const handleSubmit = () => {
    if (!bom || bomItems.length === 0) return;

    const bomData = {
      items: bomItems,
    };

    updateBOMMutation.mutate({
      id: bomId,
      data: bomData,
      product: {
        _id: bom.product_id,
        data: productData,
      },
    });
  };

  const totalCost = bomItems.reduce(
    (sum, item) => sum + item.quantity * item.raw_material.price,
    0,
  );

  if (bomLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/bom")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BOMs
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/bom")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BOMs
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold">Edit Bill of Materials</h1>
            </div>
          </div>
        </div>
        {bomItems.length > 0 && (
          <Badge variant="secondary" className="text-lg px-4 py-2">
            Total Cost: {formatPrice(totalCost)}
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                value={productData.name}
                onChange={(e) =>
                  setProductData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter product name"
              />
            </div>
            <div className="">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={productData.description}
                onChange={(e) =>
                  setProductData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Product description"
                rows={2}
                required
              />
            </div>
            <div>
              <Label htmlFor="productSku">SKU</Label>
              <Input
                id="productSku"
                value={productData.sku}
                onChange={(e) =>
                  setProductData((prev) => ({ ...prev, sku: e.target.value }))
                }
                placeholder="Enter SKU"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="productPrice">Price</Label>
                <Input
                  id="productPrice"
                  type="number"
                  value={productData.price}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      price: parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  type="text"
                  value={productData.unit}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }))
                  }
                  placeholder="e.g Piece/Kg/L"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Materials Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex flex-wrap items-center justify-between">
              <div className="shrink-0 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add Materials
              </div>
              <Dialog
                open={isNewMaterialModalOpen}
                onOpenChange={setIsNewMaterialModalOpen}
              >
                <DialogTrigger asChild>
                  <Button className="w-fit">
                    <Plus className="w-4 h-4" />
                    New
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Raw Material</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="materialName">Material Name</Label>
                      <Input
                        id="materialName"
                        value={newMaterial.name}
                        onChange={(e) =>
                          setNewMaterial((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Enter material name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="materialPrice">Price</Label>
                      <Input
                        id="materialPrice"
                        type="number"
                        value={newMaterial.price}
                        onChange={(e) =>
                          setNewMaterial((prev) => ({
                            ...prev,
                            price: parseInt(e.target.value) || 0,
                          }))
                        }
                        placeholder="Enter price"
                      />
                    </div>
                    <div>
                      <Label htmlFor="materialUnit">Unit</Label>
                      <Select
                        value={newMaterial.unit}
                        onValueChange={(value) =>
                          setNewMaterial((prev) => ({ ...prev, unit: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="piece">Piece</SelectItem>
                          <SelectItem value="kg">Kg</SelectItem>
                          <SelectItem value="liter">Liter</SelectItem>
                          <SelectItem value="meter">Meter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setIsNewMaterialModalOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() =>
                          createMaterialMutation.mutate(newMaterial)
                        }
                        disabled={
                          createMaterialMutation.isPending || !newMaterial.name
                        }
                      >
                        {createMaterialMutation.isPending
                          ? "Creating..."
                          : "Create Material"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            <div className="relative px-4">
              <Input
                placeholder="Search materials..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2 max-h-64 px-4 overflow-y-auto">
              {materialsLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))
              ) : filteredMaterials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No materials found</p>
                </div>
              ) : (
                filteredMaterials.map((material) => (
                  <div
                    key={material._id}
                    className="p-4 border-2 rounded-md border-black cursor-pointer transform transition-transform bg-white hover:bg-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-lg text-black uppercase">
                          {material.name}
                        </p>
                        <p className="text-sm font-bold text-black">
                          {formatPrice(material.price)} / {material.unit}
                        </p>
                      </div>
                      <Button
                        className="w-fit"
                        onClick={() => addMaterialToBOM(material)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* BOM Items */}
      {bomItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>BOM Materials ({bomItems.length})</div>
              <Badge variant="secondary" className="text-lg">
                Total: {formatPrice(totalCost)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomItems.map((item) => (
                  <TableRow key={item.raw_material_id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {item.raw_material.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          per {item.raw_material.unit}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {formatPrice(item.raw_material.price)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="mb-1"
                          variant="outline"
                          onClick={() =>
                            updateItemQuantity(
                              item.raw_material_id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              item.raw_material_id,
                              parseInt(e.target.value) || 0,
                            )
                          }
                          className="w-20 text-center"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="mb-1"
                          onClick={() =>
                            updateItemQuantity(
                              item.raw_material_id,
                              item.quantity + 1,
                            )
                          }
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <Badge variant="secondary">
                        {formatPrice(item.quantity * item.raw_material.price)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="mb-1"
                        variant="destructive"
                        onClick={() => removeItem(item.raw_material_id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Submit Buttons */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.push("/bom")}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={bomItems.length === 0 || updateBOMMutation.isPending}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateBOMMutation.isPending ? "Updating BOM..." : "Update BOM"}
        </Button>
      </div>
    </div>
  );
}
