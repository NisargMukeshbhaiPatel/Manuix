"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Package,
  ShoppingCart,
  Save,
  User,
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
import { getInitials, formatDate, formatPrice } from "@/lib/utils";

export default function EditBOMTable() {
  const router = useRouter();
  const params = useParams();
  const queryClient = getQueryClient();
  const bomId = params.id;

  const [productData, setProductData] = useState({
    name: "",
    sku: "",
    price: 0,
    unit: "piece",
  });
  const [bomItems, setBomItems] = useState([]);
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);

  // New material form
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    price: 0,
    unit: "piece",
  });

  // Fetch BOM by ID
  const {
    data: bom,
    isLoading: bomLoading,
    error,
  } = useQuery({
    queryKey: ["bom", bomId],
    queryFn: () => getBOMById(bomId),
  });

  // Fetch raw materials
  const { data: rawMaterials = [], isLoading: materialsLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: getRawMaterials,
  });

  // Initialize form data when BOM is loaded
  useEffect(() => {
    if (bom) {
      setProductData({
        name: bom.product.name,
        sku: bom.product.sku,
        price: bom.product.price,
        unit: bom.product.unit,
      });
      setBomItems(
        bom.items.map((item) => ({
          raw_material: item.raw_material,
          quantity: item.quantity,
        })),
      );
    }
  }, [bom]);

  const updateBOMMutation = useMutation({
    mutationFn: ({ id, data }) => updateBOM(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["bom", bomId] });
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
      (item) => item.raw_material.id === material.id,
    );
    if (existingItem) {
      setBomItems((prev) =>
        prev.map((item) =>
          item.raw_material.id === material.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setBomItems((prev) => [...prev, { raw_material: material, quantity: 1 }]);
    }
  };

  const updateItemQuantity = (materialId, quantity) => {
    if (quantity <= 0) {
      setBomItems((prev) =>
        prev.filter((item) => item.raw_material.id !== materialId),
      );
    } else {
      setBomItems((prev) =>
        prev.map((item) =>
          item.raw_material.id === materialId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const removeItem = (materialId) => {
    setBomItems((prev) =>
      prev.filter((item) => item.raw_material.id !== materialId),
    );
  };

  const handleSubmit = () => {
    if (!bom || bomItems.length === 0) return;

    const bomData = {
      product: {
        _id: bom.product._id,
        ...productData,
      },
      items: bomItems,
    };

    updateBOMMutation.mutate({
      id: bomId,
      data: bomData,
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

  if (error || !bom) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/bom")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BOMs
          </Button>
          <h1 className="text-3xl font-bold">Edit Bill of Materials</h1>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium text-destructive">
              BOM not found or error loading data
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The BOM you're looking for might have been deleted or you don't
              have access to it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/bom")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to BOMs
          </Button>
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-3xl font-bold">Edit Bill of Materials</h1>
              <p className="text-muted-foreground">
                Update BOM for {productData.name}
              </p>
            </div>
            {/* Creator Avatar with Tooltip */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="w-10 h-10 cursor-help">
                    <AvatarFallback className="text-sm">
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
                    <div className="text-xs text-muted-foreground">
                      Created {formatDate(bom.createdAt)}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
                  step="0.01"
                  value={productData.price}
                  onChange={(e) =>
                    setProductData((prev) => ({
                      ...prev,
                      price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="productUnit">Unit</Label>
                <Select
                  value={productData.unit}
                  onValueChange={(value) =>
                    setProductData((prev) => ({ ...prev, unit: value }))
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
            </div>
          </CardContent>
        </Card>

        {/* Raw Materials Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Add Components
              </div>
              <Dialog
                open={isNewMaterialModalOpen}
                onOpenChange={setIsNewMaterialModalOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    New Material
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
                        step="0.01"
                        value={newMaterial.price}
                        onChange={(e) =>
                          setNewMaterial((prev) => ({
                            ...prev,
                            price: parseFloat(e.target.value) || 0,
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
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search materials..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
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
                    key={material.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(material.price)} / {material.unit}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addMaterialToBOM(material)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
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
              <div>BOM Components ({bomItems.length})</div>
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
                  <TableRow key={item.raw_material.id}>
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
                          variant="outline"
                          onClick={() =>
                            updateItemQuantity(
                              item.raw_material.id,
                              item.quantity - 1,
                            )
                          }
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) =>
                            updateItemQuantity(
                              item.raw_material.id,
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-20 text-center"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            updateItemQuantity(
                              item.raw_material.id,
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
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.raw_material.id)}
                      >
                        <X className="w-4 h-4 text-destructive" />
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
