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

export default function PurchaseOrdersPage({ perms }) {
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
    onError: (e) => {
      toast({
        title: e.message || "Failed to update purchase order",
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
        <div className="flex items-end">
          <Button variant="outline" onClick={clearFilters}>
            Clear
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading purchase orders...</div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Error loading purchase orders: {error.message}
        </div>
      ) : (
        <>
          {data?.data?.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-muted-foreground">
                  No purchase orders found
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Total</TableHead>
                    {(perms?.canEdit || perms?.canDelete) && (
                      <TableHead className="text-right">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.map((order) => (
                    <PurchaseOrderRow
                      key={order._id}
                      order={order}
                      onEdit={perms?.canEdit ? handleEdit : undefined}
                      onDelete={perms?.canDelete ? handleDelete : undefined}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {data?.pagination && data.pagination.pages > 1 && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Page {page} of {data.pagination.pages} ({data.pagination.total}{" "}
                total)
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => Math.min(data.pagination.pages, prev + 1))
                  }
                  disabled={page === data.pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      {perms?.canEdit && editingOrder && (
        <Dialog
          open={!!editingOrder}
          onOpenChange={() => setEditingOrder(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Purchase Order</DialogTitle>
              <DialogDescription>
                Update the purchase order details below.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier Name</Label>
                <Input
                  id="supplier"
                  value={editingOrder.supplier_name}
                  onChange={(e) =>
                    setEditingOrder((prev) => ({
                      ...prev,
                      supplier_name: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={editingOrder.status}
                  onValueChange={(value) =>
                    setEditingOrder((prev) => ({ ...prev, status: value }))
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
      )}

      {/* Delete Confirmation Dialog */}
      {perms?.canDelete && (
        <AlertDialog
          open={!!deletingOrderId}
          onOpenChange={() => setDeletingOrderId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Purchase Order</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this purchase order? This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
