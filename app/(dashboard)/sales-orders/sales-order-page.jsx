"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Button } from "@/components/button";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
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
import { Badge } from "@/components/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/alert-dialog";
import { ChevronDown, ChevronRight, Trash2, Filter } from "lucide-react";
import { getSalesOrders, deleteSalesOrder } from "@/actions/sales-order";
import { formatDate } from "@/lib/utils";
import SearchInput from "@/components/search-input";
import EditSalesOrderDialog from "./components/edit-sales-order-dialog";
import EditPaymentDialog from "./components/edit-payment-dialog";

export default function SalesOrdersPage() {
  const [page, setPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [filters, setFilters] = useState({
    status: "all",
    customerName: "",
    startDate: "",
    endDate: "",
    search: "",
  });

  const queryClient = getQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["salesOrders", page, filters],
    queryFn: () =>
      getSalesOrders({
        page,
        status: filters.status === "all" ? null : filters.status,
        customerName: filters.customerName || filters.search || null,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSalesOrder,
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error);
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
    },
    onError: (e) => {
      toast({
        title: e.message || "Failed to delete product. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleRowExpansion = (orderId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedRows(newExpanded);
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      customerName: "",
      startDate: "",
      endDate: "",
      search: "",
    });
    setPage(1);
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: "warning",
      pending: "warning",
      completed: "default",
    };
    return <Badge variant={variants[status] || "warning"}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const variants = {
      paid: "default",
      pending: "warning",
      overdue: "warning",
      partial: "warning",
    };
    return <Badge variant={variants[status] || "warning"}>{status}</Badge>;
  };

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-red-500">
              Error loading sales orders
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Customer</Label>
            <SearchInput
              placeholder="Search by customer name..."
              value={filters.search}
              onChange={(value) => handleFilterChange("search", value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Date Range</Label>
            <div className="flex gap-2">
              <Input
                type="date"
                placeholder="Start"
                value={filters.startDate}
                onChange={(e) =>
                  handleFilterChange("startDate", e.target.value)
                }
                className="flex-1"
              />
              <Input
                type="date"
                placeholder="End"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </div>

        <Button variant="outline" onClick={clearFilters}>
          Clear Filters
        </Button>
      </div>

      {/* Sales Orders Table */}
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Order Total</TableHead>
              <TableHead className="">Updated</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No sales orders found
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((order) => (
                <React.Fragment key={order._id}>
                  <TableRow>
                    <TableCell>
                      <Button
                        variant="icon"
                        size="sm"
                        className="p-0"
                        onClick={() => toggleRowExpansion(order._id)}
                      >
                        {expandedRows.has(order._id) ? (
                          <ChevronDown className="h-6 w-6" />
                        ) : (
                          <ChevronRight className="h-6 w-6" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div>
                        <div>{order.customer_name}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.payment_status)}
                    </TableCell>
                    <TableCell>${order.payment_amount.toFixed(2)}</TableCell>
                    <TableCell className="">
                      ${order.orderTotal.toFixed(2)}
                    </TableCell>
                    <TableCell className="">
                      {formatDate(order.updatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <EditSalesOrderDialog order={order} />
                        <EditPaymentDialog order={order} />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Sales Order
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this sales
                                order? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(order._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRows.has(order._id) && (
                    <TableRow>
                      <TableCell colSpan={8}>
                        <>
                          <h4 className="font-semibold mb-3">Order Items</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Product</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead>Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items.map((item) => (
                                <TableRow key={item._id}>
                                  <TableCell className="font-medium">
                                    {item.product.name}
                                  </TableCell>
                                  <TableCell>{item.product.sku}</TableCell>
                                  <TableCell>
                                    <p className="text-sm text-muted-foreground line-clamp-4">
                                      {item.product.description}
                                    </p>
                                  </TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{item.product.unit}</TableCell>
                                  <TableCell>
                                    ${item.price.toFixed(2)}
                                  </TableCell>
                                  <TableCell>
                                    ${(item.quantity * item.price).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.total > data.limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {(data.pagination.page - 1) * data.pagination.limit + 1} to{" "}
            {Math.min(
              data.pagination.page * data.pagination.limit,
              data.pagination.total,
            )}{" "}
            of {data.pagination.total} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {data.pagination.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= data.pagination.pages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
