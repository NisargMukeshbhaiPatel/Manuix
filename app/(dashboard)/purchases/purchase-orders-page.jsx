"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";

import { Filter } from "lucide-react";
import SearchInput from "@/components/search-input";
import { Button } from "@/components/button";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/alert-dialog";
import PurchaseOrderRow from "./components/purchase-order-row";
import { toast } from "@/hooks/use-toast";
import {
  getPurchaseOrders,
  updatePurchaseOrder,
  deletePurchaseOrder,
} from "@/actions/purchase-order";

export default function PurchaseOrdersPage() {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    search: "",
  });
  const [editingOrder, setEditingOrder] = useState(null);
  const [deletingOrderId, setDeletingOrderId] = useState(null);

  const queryClient = getQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["purchase-orders", page, filters],
    queryFn: () =>
      getPurchaseOrders({
        page,
        status: filters.status === "all" ? null : filters.status,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
        search: filters.search,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePurchaseOrder(id, data),
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Purchase order updated successfully",
      });
      setEditingOrder(null);
    },
    onError: () => {
      toast({
        title: "Failed to update purchase order",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePurchaseOrder,
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({
        title: "Purchase order deleted successfully",
      });
      setDeletingOrderId(null);
    },
    onError: () => {
      toast({
        title: "Failed to delete purchase order",
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
  };

  const handleDelete = (id) => {
    setDeletingOrderId(id);
  };

  const confirmDelete = () => {
    if (deletingOrderId) {
      deleteMutation.mutate(deletingOrderId);
    }
  };

  const handleSaveEdit = () => {
    if (editingOrder) {
      updateMutation.mutate({
        id: editingOrder._id,
        data: {
          supplier_name: editingOrder.supplier_name,
          status: editingOrder.status,
          items: editingOrder.items.map((item) => ({
            raw_material_id: item.raw_material.id,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      });
    }
  };
  const clearFilters = () => {
    setFilters({
      status: "all",
      supplierId: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Filter className="h-5 w-5" />
        Filters
      </h3>
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="search">Search</Label>
          <SearchInput
            value={filters.search}
            onChange={(value) => handleFilterChange("search", value)}
            placeholder="Search purchase orders..."
          />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange("status", value)}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="placed">Placed</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange("startDate", e.target.value)}
            className="w-[150px]"
          />
        </div>
        <div>
          <Label htmlFor="endDate">End Date</Label>
          <Input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange("endDate", e.target.value)}
            className="w-[150px]"
          />
        </div>
      </div>
      <Button variant="outline" onClick={clearFilters}>
        Clear Filters
      </Button>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Supplier Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-red-500"
                >
                  Error loading purchase orders
                </TableCell>
              </TableRow>
            ) : data?.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              data?.data.map((order) => (
                <PurchaseOrderRow
                  key={order._id}
                  order={order}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingOrder} onOpenChange={() => setEditingOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Purchase Order</DialogTitle>
            <DialogDescription>
              Update the purchase order details
            </DialogDescription>
          </DialogHeader>
          {editingOrder && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier Name</Label>
                <Input
                  id="supplier"
                  value={editingOrder.supplier_name}
                  onChange={(e) =>
                    setEditingOrder({
                      ...editingOrder,
                      supplier_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingOrder.status}
                  onValueChange={(value) =>
                    setEditingOrder({
                      ...editingOrder,
                      status: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="placed">Placed</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingOrder(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!deletingOrderId}
        onOpenChange={() => setDeletingOrderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              purchase order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
