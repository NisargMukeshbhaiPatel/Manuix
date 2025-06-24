"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, ArrowLeft, Package } from "lucide-react";
import Link from "next/link";

import { createPurchaseOrder } from "@/actions/purchase-order";
import { getRawMaterials, createRawMaterial } from "@/actions/raw-material";
import MaterialForm from "../../raw-materials/components/material-form";

export default function CreatePurchaseOrderForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    supplier_name: "",
    supplier_contact: "",
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: "",
    status: "draft",
    notes: "",
    items: []
  });
  const [showMaterialDialog, setShowMaterialDialog] = useState(false);

  // Fetch raw materials for the dropdown
  const { data: rawMaterialsData, isLoading: rawMaterialsLoading } = useQuery({
    queryKey: ["raw-materials", { page: 1, limit: 100 }],
    queryFn: () => getRawMaterials({ page: 1, limit: 100 }),
  });

  // Mutation for creating purchase orders
  const mutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Purchase order created successfully",
        });
        router.push("/purchases");
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create purchase order",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create purchase order",
        variant: "destructive",
      });
    },
  });

  // Mutation for creating raw materials
  const createMaterialMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Success",
          description: "Raw material created successfully",
        });
        // Invalidate and refetch raw materials
        queryClient.invalidateQueries({ queryKey: ["raw-materials"] });
        setShowMaterialDialog(false);
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to create raw material",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create raw material",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.supplier_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required",
        variant: "destructive",
      });
      return;
    }

    if (formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one item is required",
        variant: "destructive",
      });
      return;
    }

    // Validate all items
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.raw_material_id || !item.quantity || item.quantity <= 0 || !item.price || item.price <= 0) {
        toast({
          title: "Validation Error",
          description: `Item ${i + 1}: Please fill in all fields with valid values`,
          variant: "destructive",
        });
        return;
      }
    }

    mutation.mutate(formData);
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { raw_material_id: "", quantity: "", price: "" }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateMaterial = (materialData) => {
    createMaterialMutation.mutate(materialData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/purchases">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Purchase Orders
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Purchase Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier_name">Supplier Name *</Label>
                <Input
                  id="supplier_name"
                  value={formData.supplier_name}
                  onChange={(e) => updateFormData("supplier_name", e.target.value)}
                  placeholder="Enter supplier name"
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier_contact">Supplier Contact</Label>
                <Input
                  id="supplier_contact"
                  value={formData.supplier_contact}
                  onChange={(e) => updateFormData("supplier_contact", e.target.value)}
                  placeholder="Phone, email, or contact person"
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_date">Order Date *</Label>
                <Input
                  id="order_date"
                  type="date"
                  value={formData.order_date}
                  onChange={(e) => updateFormData("order_date", e.target.value)}
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
                <Input
                  id="expected_delivery_date"
                  type="date"
                  value={formData.expected_delivery_date}
                  onChange={(e) => updateFormData("expected_delivery_date", e.target.value)}
                  disabled={mutation.isPending}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => updateFormData("status", value)}
                  disabled={mutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Additional notes or special instructions"
                disabled={mutation.isPending}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>        {/* Items */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Items</CardTitle>
              <div className="flex items-center gap-2">
                <Dialog open={showMaterialDialog} onOpenChange={setShowMaterialDialog}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={mutation.isPending}
                      className="gap-2"
                    >
                      <Package className="h-4 w-4" />
                      Create Raw Material
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create Raw Material</DialogTitle>
                      <DialogDescription>
                        Add a new raw material to your inventory.
                      </DialogDescription>
                    </DialogHeader>
                    <MaterialForm
                      onSubmit={handleCreateMaterial}
                      onCancel={() => setShowMaterialDialog(false)}
                      isLoading={createMaterialMutation.isPending}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addItem}
                  disabled={mutation.isPending}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formData.items.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No items added yet. Click "Add Item" to get started.
              </div>
            ) : (
              formData.items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Item {index + 1}</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={mutation.isPending}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Raw Material *</Label>
                      <Select
                        value={item.raw_material_id}
                        onValueChange={(value) => updateItem(index, "raw_material_id", value)}
                        disabled={mutation.isPending || rawMaterialsLoading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select raw material" />
                        </SelectTrigger>
                        <SelectContent>
                          {rawMaterialsLoading ? (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              Loading raw materials...
                            </div>
                          ) : rawMaterialsData?.data && rawMaterialsData.data.length > 0 ? (
                            rawMaterialsData.data.map((material) => (
                              <SelectItem key={material._id} value={material._id}>
                                {material.name} ({material.unit})
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No raw materials available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                        placeholder="Enter quantity"
                        disabled={mutation.isPending}
                        min="1"
                        step="0.01"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(index, "price", e.target.value)}
                        placeholder="Enter unit price"
                        disabled={mutation.isPending}
                        min="0.01"
                        step="0.01"
                      />
                    </div>
                  </div>
                  {item.quantity && item.price && (
                    <div className="text-right text-sm text-muted-foreground">
                      Subtotal: ${(parseFloat(item.quantity || 0) * parseFloat(item.price || 0)).toFixed(2)}
                    </div>
                  )}
                </div>
              ))
            )}
            {formData.items.length > 0 && (
              <div className="border-t pt-4">
                <div className="text-right font-semibold">
                  Total: ${formData.items.reduce((total, item) => 
                    total + (parseFloat(item.quantity || 0) * parseFloat(item.price || 0)), 0
                  ).toFixed(2)}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="gap-2"
          >
            {mutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Create Purchase Order
          </Button>
          <Link href="/purchases">
            <Button type="button" variant="outline" disabled={mutation.isPending}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
