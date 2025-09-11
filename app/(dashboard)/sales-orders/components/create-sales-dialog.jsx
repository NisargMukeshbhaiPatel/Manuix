"use client";
import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Button } from "@/components/button";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Plus, Trash2 } from "lucide-react";
import { createSalesOrder } from "@/actions/sales-order";
import { getProducts } from "@/actions/product";
import SearchInput from "@/components/search-input";
import { currency, formatPrice } from "@/lib/utils";

export default function CreateSalesOrderDialog() {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    status: "draft",
    payment_status: "pending",
    payment_amount: 0,
    items: [],
    notes: "",
  });
  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: 1,
    price: 0,
  });
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const queryClient = getQueryClient();

  // Query for products
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", productSearch],
    queryFn: () => getProducts({ page: 1, limit: 50, name: productSearch }),
    enabled: open, // Only fetch when dialog is open
  });

  const createMutation = useMutation({
    mutationFn: createSalesOrder,
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error || data.message);
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      setOpen(false);
      resetForm();
      toast({
        title: "Sales order created successfully",
        variant: "default",
      });
    },
    onError: (e) => {
      toast({
        title: e.message || "Failed to create sales order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      customer_name: "",
      status: "draft",
      payment_status: "pending",
      payment_amount: 0,
      items: [],
      notes: "",
    });
    setCurrentItem({
      product_id: "",
      quantity: 1,
      price: 0,
    });
    setProductSearch("");
    setSelectedProduct(null);
  };

  const selectProduct = (product) => {
    setSelectedProduct(product);
    setCurrentItem((prev) => ({
      ...prev,
      product_id: product._id,
      price: product.selling_price || product.price || 0,
    }));
    setProductSearch(product.name);
  };

  const addItem = () => {
    if (!selectedProduct || !currentItem.quantity) {
      toast({
        title: "Please select a product and enter quantity",
        variant: "destructive",
      });
      return;
    }

    const newItem = {
      _id: Date.now().toString(),
      product_id: selectedProduct._id,
      product: selectedProduct,
      quantity: currentItem.quantity,
      price: currentItem.price,
    };

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));

    setCurrentItem({
      product_id: "",
      quantity: 1,
      price: 0,
    });
    setProductSearch("");
    setSelectedProduct(null);
  };

  const removeItem = (itemId) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item._id !== itemId),
    }));
  };

  const calculateTotal = () => {
    return formData.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0,
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.customer_name || formData.items.length === 0) {
      toast({
        title: "Customer name and at least one item are required",
        variant: "destructive",
      });
      return;
    }

    const orderData = {
      ...formData,
      items: formData.items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.price,
      })),
      total_amount: calculateTotal(),
      orderTotal: calculateTotal(),
    };

    createMutation.mutate(orderData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" />
          Create Sales Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Sales Order</DialogTitle>
          <DialogDescription>
            Create a new sales order with customer details and items.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customer_name">Customer Name *</Label>
              <Input
                id="customer_name"
                value={formData.customer_name}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    customer_name: e.target.value,
                  }))
                }
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Payment Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_status">Payment Status</Label>
              <Select
                value={formData.payment_status}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, payment_status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="payment_amount">Payment Amount</Label>
              <Input
                id="payment_amount"
                type="number"
                value={formData.payment_amount}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    payment_amount: parseInt(e.target.value) || 0,
                  }))
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Add Items Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Add Items</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div>
                <Label htmlFor="product_search">Search Product *</Label>
                <div className="relative">
                  <SearchInput
                    id="product_search"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={setProductSearch}
                  />
                  {productSearch && !selectedProduct && productsData?.data && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {productsLoading ? (
                        <div className="p-2 text-center">
                          Loading products...
                        </div>
                      ) : productsData.data.length === 0 ? (
                        <div className="p-2 text-center text-gray-500">
                          No products found
                        </div>
                      ) : (
                        productsData.data.map((product) => (
                          <div
                            key={product._id}
                            className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                            onClick={() => selectProduct(product)}
                          >
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">
                              SKU: {product.sku} | Price: {currency}
                              {product.selling_price || product.price || 0}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
                {selectedProduct && (
                  <div className="p-2 bg-blue-50 rounded-md">
                    <div className="font-medium">{selectedProduct.name}</div>
                    <div className="text-sm text-gray-600">
                      SKU: {selectedProduct.sku} | Unit: {selectedProduct.unit}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  value={currentItem.price}
                  onChange={(e) =>
                    setCurrentItem((prev) => ({
                      ...prev,
                      price: parseInt(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                />
              </div>
              <div>
                <Label>&nbsp;</Label>
                <Button
                  type="button"
                  onClick={addItem}
                  className="w-full"
                  disabled={!selectedProduct}
                >
                  Add Item
                </Button>
              </div>
            </div>
          </div>

          {/* Items List */}
          {formData.items.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Order Items</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell>{item.product.name}</TableCell>
                      <TableCell>{item.product.sku}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.product.unit}</TableCell>
                      <TableCell>{formatPrice(item.price)}</TableCell>
                      <TableCell>
                        {formatPrice(item.quantity * item.price)}
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeItem(item._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="text-right">
                <strong>Total: {formatPrice(calculateTotal())}</strong>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating..." : "Create Sales Order"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
