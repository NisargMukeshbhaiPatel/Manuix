"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Badge } from "@/components/badge";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";

import CreateProductModal from "@/(dashboard)/products/components/create-product-modal";

import { Skeleton } from "@/components/skeleton";
import { createBOM } from "@/actions/bom";
import { createProduct, getProductsWithoutBOM } from "@/actions/product";
import { createRawMaterial, getRawMaterials } from "@/actions/raw-material";
import { formatPrice } from "@/lib/utils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  ShoppingCart,
  Save,
  ArrowLeft,
} from "lucide-react";

export default function CreateBOMForm() {
  const router = useRouter();
  const queryClient = getQueryClient();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [bomItems, setBomItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState(false);

  // New product form
  const [newProduct, setNewProduct] = useState({
    name: "",
    sku: "",
    price: 0,
    unit: "piece",
  });

  // New material form
  const [newMaterial, setNewMaterial] = useState({
    name: "",
    price: 0,
    unit: "piece",
  });

  const {
    data: resProd,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products-without-bom"],
    queryFn: getProductsWithoutBOM,
  });
  const products = resProd?.success ? resProd.data : [];

  const { data: resMaterials, isLoading: materialsLoading } = useQuery({
    queryKey: ["raw-materials"],
    queryFn: getRawMaterials,
  });
  const rawMaterials = resMaterials?.success ? resMaterials.data : [];

  // Create BOM mutation
  const createBOMMutation = useMutation({
    mutationFn: createBOM,
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["boms"] });
      queryClient.invalidateQueries({ queryKey: ["products-without-bom"] });
      router.push("/bom");
    },
    onError: (e) => {
      console.error(e);
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["products-without-bom"] });
      setSelectedProduct(data.product);
      setNewProduct({ name: "", sku: "", price: 0, unit: "piece" });
      setIsNewProductModalOpen(false);
    },
    onError: (e) => {
      console.error(e);
    },
  });

  // Create raw material mutation
  const createMaterialMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      if (!data.success) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
      setNewMaterial({ name: "", price: 0, unit: "piece" });
      setIsNewMaterialModalOpen(false);
    },
    onError: (e) => {
      console.error(e);
    },
  });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredMaterials = rawMaterials.filter((material) =>
    material.name.toLowerCase().includes(materialSearchTerm.toLowerCase()),
  );

  const addMaterialToBOM = (material) => {
    const existingItem = bomItems.find(
      (item) => item.raw_material._id === material._id,
    );
    if (existingItem) {
      setBomItems((prev) =>
        prev.map((item) =>
          item.raw_material._id === material._id
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
        prev.filter((item) => item.raw_material._id !== materialId),
      );
    } else {
      setBomItems((prev) =>
        prev.map((item) =>
          item.raw_material._id === materialId ? { ...item, quantity } : item,
        ),
      );
    }
  };

  const removeItem = (materialId) => {
    setBomItems((prev) =>
      prev.filter((item) => item.raw_material._id !== materialId),
    );
  };

  const handleSubmit = () => {
    if (!selectedProduct || bomItems.length === 0) return;

    const bomData = {
      product_id: selectedProduct._id,
      items: bomItems.map((item) => ({
        raw_material_id: item.raw_material._id,
        quantity: item.quantity,
      })),
    };

    createBOMMutation.mutate(bomData);
  };

  const totalCost = bomItems.reduce(
    (sum, item) => sum + item.quantity * item.raw_material.price,
    0,
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/bom")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to BOM
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Create Bill of Materials</h1>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Left Column - Product Selection */}
        <div className="space-y-6">
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Select Product
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              <div className="flex gap-2 px-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsNewProductModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Product
                </Button>
              </div>
              <CreateProductModal
                isOpen={isNewProductModalOpen}
                withBom={true}
                onClose={() => setIsNewProductModalOpen(false)}
              />

              <div className="space-y-3 max-h-80 overflow-y-auto pl-4 pr-2">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-8 text-black font-bold text-lg border-2 rounded-md border-black bg-white">
                    NO PRODUCTS FOUND
                  </div>
                ) : (
                  filteredProducts.map((product) => (
                    <div
                      key={product._id}
                      className={`p-4 border-2 rounded-md border-black cursor-pointer transform transition-transform ${
                        selectedProduct?._id === product._id
                          ? "bg-green-400 shadow-[2px_2px_0_rgba(0,0,0,1)]"
                          : "bg-white hover:bg-gray-100"
                      }`}
                      onClick={() => setSelectedProduct(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-lg text-black uppercase">
                            {product.name}
                          </p>
                          <p className="text-sm font-bold text-black">
                            SKU: {product.sku}
                          </p>
                        </div>
                        <div className="px-3 py-1 border-2 border-black bg-white font-black text-black">
                          {formatPrice(product.price)} / {product.unit}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Raw Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Raw Materials
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 px-0">
              <div className="flex gap-2 px-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search materials..."
                    value={materialSearchTerm}
                    onChange={(e) => setMaterialSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Dialog
                  open={isNewMaterialModalOpen}
                  onOpenChange={setIsNewMaterialModalOpen}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      New Material
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Raw Material</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="material-name">Material Name</Label>
                        <Input
                          id="material-name"
                          value={newMaterial.name}
                          onChange={(e) =>
                            setNewMaterial({
                              ...newMaterial,
                              name: e.target.value,
                            })
                          }
                          placeholder="Enter material name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="material-price">Price</Label>
                        <Input
                          id="material-price"
                          type="number"
                          step="0.01"
                          value={newMaterial.price}
                          onChange={(e) =>
                            setNewMaterial({
                              ...newMaterial,
                              price: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="Enter price"
                        />
                      </div>
                      <div>
                        <Label htmlFor="unit">Unit</Label>
                        <Input
                          id="unit"
                          type="text"
                          value={newMaterial.unit}
                          onChange={(e) =>
                            setNewMaterial({
                              ...newMaterial,
                              unit: e.target.value,
                            })
                          }
                          placeholder="e.g Piece/Kg/L"
                          required
                        />
                      </div>
                      <Button
                        onClick={() =>
                          createMaterialMutation.mutate(newMaterial)
                        }
                        disabled={
                          createMaterialMutation.isPending || !newMaterial.name
                        }
                        className="w-full"
                      >
                        {createMaterialMutation.isPending
                          ? "Creating..."
                          : "Create Material"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pl-4 pr-2">
                {materialsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))
                ) : filteredMaterials.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No materials found
                  </div>
                ) : (
                  filteredMaterials.map((material) => (
                    <div
                      key={material._id}
                      className="p-4 border-2 rounded-md border-black cursor-pointer transform transition-transform bg-white hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="shrink-0">
                          <p className="font-black text-lg text-black uppercase">
                            {material.name}
                          </p>
                          <p className="text-sm font-bold text-black">
                            {formatPrice(material.price)} / {material.unit}
                          </p>
                        </div>
                        <Button
                          className="w-fit px-2"
                          onClick={() => addMaterialToBOM(material)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/*  BOM Items */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>BOM Items</CardTitle>
              {bomItems.length > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {bomItems.length} items
                  </p>
                  <Badge variant="secondary" className="text-lg">
                    Total: {formatPrice(totalCost)}
                  </Badge>
                </div>
              )}
            </CardHeader>
            <CardContent>
              {bomItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No items added yet</p>
                  <p className="text-sm">
                    Select materials from the left to add them to the BOM
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead className="w-20">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bomItems.map((item) => (
                        <TableRow key={item.raw_material._id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {item.raw_material.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatPrice(item.raw_material.price)} /{" "}
                                {item.raw_material.unit}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateItemQuantity(
                                    item.raw_material._id,
                                    item.quantity - 1,
                                  )
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                  updateItemQuantity(
                                    item.raw_material._id,
                                    parseInt(e.target.value) || 1,
                                  )
                                }
                                className="w-20 text-center"
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  updateItemQuantity(
                                    item.raw_material._id,
                                    item.quantity + 1,
                                  )
                                }
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {formatPrice(
                                item.quantity * item.raw_material.price,
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              className="mb-1"
                              variant="destructive"
                              onClick={() => removeItem(item.raw_material._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className="flex justify-end gap-4 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedProduct(null);
                        setBomItems([]);
                      }}
                    >
                      Clear All
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        !selectedProduct ||
                        bomItems.length === 0 ||
                        createBOMMutation.isPending
                      }
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {createBOMMutation.isPending
                        ? "Creating BOM..."
                        : "Create BOM"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
