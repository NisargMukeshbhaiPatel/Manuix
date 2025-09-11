"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Button } from "@/components/button";
import { Label } from "@/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { Card, CardContent } from "@/components/card";
import { Badge } from "@/components/badge";
import SearchInput from "@/components/search-input";
import { Loader2, Check } from "lucide-react";

import { getInventoryItems } from "@/actions/inventory";
import { getSalesOrders, updateSalesOrder } from "@/actions/sales-order";
import { getProductionDrafts } from "@/actions/production-draft";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import { DeleteDialog } from "./components/delete-dialog";
import { Pagination } from "./components/pagination";
import { EditQuantityDialog } from "./components/edit-quantity-dialog";
import { ProduceProductPopup } from "./components/produce-product-popup";

export default function InventoryManagement({ perms }) {
  // State for produce popup
  const [producePopupOpen, setProducePopupOpen] = useState(false);
  const [producePopupProductId, setProducePopupProductId] = useState("");
  const [producePopupSalesOrderId, setProducePopupSalesOrderId] = useState("");
  const [producePopupQuantity, setProducePopupQuantity] = useState("");
  const [producePopupProductName, setProducePopupProductName] = useState("");
  const [producePopupProductSku, setProducePopupProductSku] = useState("");
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemType, setItemType] = useState("all");
  const [lowStock, setLowStock] = useState(false);
  const [salesOrdersPage, setSalesOrdersPage] = useState(1);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const limit = 10;

  // Fetch productionDrafts client-side
  const {
    data: productionDrafts = [],
    isLoading: isProductionDraftsLoading,
    error: productionDraftsError,
    refetch: refetchProductionDrafts
  } = useQuery({
    queryKey: ["productionDrafts"],
    queryFn: getProductionDrafts,
  });

  const queryKey = [
    "inventory",
    { page, limit, itemType, lowStock, searchTerm },
  ];
  const queryClient = getQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      getInventoryItems({
        page,
        limit,
        itemType: itemType || undefined,
        lowStock: lowStock || undefined,
      }),
  });

  // Sales Orders query
  const {
    data: salesOrdersData,
    isLoading: isSalesOrdersLoading,
    error: salesOrdersError,
    refetch: refetchSalesOrders
  } = useQuery({
    queryKey: ["salesOrders", salesOrdersPage],
    queryFn: () => getSalesOrders({ page: salesOrdersPage, limit: 5, status: "draft" }),
  });

  // Complete Order mutation with loading and result feedback
  const completeOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      return updateSalesOrder(orderId, { status: "completed" });
    },
    onSuccess: (data) => {
      refetchSalesOrders();
      refetchProductionDrafts();
      refetch();
      toast({
        title: "Order Completed",
        description: data?.message || "Sales order marked as completed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Completing Order",
        description: error?.message || "Failed to complete sales order.",
        variant: "destructive",
      });
    },
  });

  // ...existing code...
  // Prefetch next/previous page (unchanged)
  const prefetchNextPage = () => {
    if (data?.pagination && page < data.pagination.pages) {
      queryClient.prefetchQuery({
        queryKey: [
          "inventory",
          { page: page + 1, limit, itemType, lowStock, searchTerm },
        ],
        queryFn: () =>
          getInventoryItems({
            page: page + 1,
            limit,
            itemType: itemType || undefined,
            lowStock: lowStock || undefined,
          }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  // Prefetch next/previous page for sales orders
  const prefetchNextSalesOrdersPage = () => {
    if (salesOrdersData?.pagination && salesOrdersPage < salesOrdersData.pagination.pages) {
      queryClient.prefetchQuery({
        queryKey: ["salesOrders", salesOrdersPage + 1],
        queryFn: () => getSalesOrders({ page: salesOrdersPage + 1, limit: 5, status: "draft" }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };
  const prefetchPreviousSalesOrdersPage = () => {
    if (salesOrdersPage > 1) {
      queryClient.prefetchQuery({
        queryKey: ["salesOrders", salesOrdersPage - 1],
        queryFn: () => getSalesOrders({ page: salesOrdersPage - 1, limit: 5, status: "draft" }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  const prefetchPreviousPage = () => {
    if (page > 1) {
      queryClient.prefetchQuery({
        queryKey: [
          "inventory",
          { page: page - 1, limit, itemType, lowStock, searchTerm },
        ],
        queryFn: () =>
          getInventoryItems({
            page: page - 1,
            limit,
            itemType: itemType || undefined,
            lowStock: lowStock || undefined,
          }),
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  // Filter data by search term (client-side filtering)
  const filteredData = useMemo(() => {
    if (!data?.data || !searchTerm) return data?.data || [];
    return data.data.filter((item) =>
      item.item.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [data?.data, searchTerm]);

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading inventory: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }
  if (productionDraftsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading production drafts: {productionDraftsError.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg mb-6">
        <h2 className="text-lg font-bold px-4 py-2 border-b">Draft Sales Orders ({salesOrdersData?.pagination.total || 0})</h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSalesOrdersLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <div className="mt-2">Loading sales orders...</div>
                </TableCell>
              </TableRow>
            ) : salesOrdersError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-red-600">
                  Error loading sales orders: {salesOrdersError.message}
                </TableCell>
              </TableRow>
            ) : !salesOrdersData?.data?.length ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  No sales orders found
                </TableCell>
              </TableRow>
            ) : (
              salesOrdersData.data.map((order) => (
                <>
                  <TableRow key={order._id + "-main"}>
                    <TableCell className="font-mono">{order._id?.slice(-8)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedOrder(expandedOrder === order._id ? null : order._id)}
                      >
                        {expandedOrder === order._id ? "Hide Items" : "Show Items"}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {order.status !== "completed" && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => completeOrderMutation.mutate(order._id)}
                          disabled={
                            completeOrderMutation.isPending ||
                            !order.items?.every(
                              (item) => item.inventory_quantity >= item.quantity
                            )
                          }
                        >
                          {completeOrderMutation.isPending ? "Completing..." : "Complete Order"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  {/* Dropdown for items */}
                  {expandedOrder === order._id && (
                    <TableRow key={order._id + "-items"}>
                      <TableCell colSpan={4} className="bg-gray-50">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>

                              <TableRow>
                                <TableHead>Product Name</TableHead>
                                <TableHead>SKU</TableHead>
                                <TableHead>Quantity</TableHead>
                                <TableHead>Inventory Quantity</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {order.items?.map((item, idx) => {
                                // Check if a draft exists for this order and product
                                const draftExists = productionDrafts.some(
                                  (draft) =>
                                    draft.sales_order_id === order._id
                                );
                                return (
                                  <TableRow key={item.product._id || idx}>
                                    <TableCell>{item.product?.name || "-"}</TableCell>
                                    <TableCell>{item.product?.sku || "-"}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>{item.inventory_quantity || "0"}</TableCell>
                                    <TableCell>
                                      {draftExists ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            window.location.href = `/production-drafts`;
                                          }}
                                        >
                                          View Draft
                                        </Button>
                                      ) : (
                                        <Button
                                          variant={item.inventory_quantity < item.quantity ? "default" : "outline"}
                                          size="sm"
                                          onClick={() => {
                                            setProducePopupSalesOrderId(order._id);
                                            setProducePopupProductId(item.product._id);
                                            setProducePopupQuantity(item.quantity.toString());
                                            setProducePopupProductName(item.product?.name || "");
                                            setProducePopupProductSku(item.product?.sku || "");
                                            setProducePopupOpen(true);
                                          }}
                                        >
                                          Produce
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                              {/* Produce Product Popup (single instance, controlled by state) */}
                              <ProduceProductPopup
                                open={producePopupOpen}
                                setOpen={setProducePopupOpen}
                                salesOrderId={producePopupSalesOrderId}
                                productId={producePopupProductId}
                                quantity={producePopupQuantity}
                                productName={producePopupProductName}
                                productSku={producePopupProductSku}
                                queryKey={queryKey}
                              />
                            </TableBody>
                          </Table>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {salesOrdersData?.pagination && salesOrdersData.pagination.pages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={salesOrdersData.pagination.page}
            totalPages={salesOrdersData.pagination.pages}
            onPageChange={(newPage) => {
              setSalesOrdersPage(newPage);
              if (newPage < salesOrdersData.pagination.pages) prefetchNextSalesOrdersPage();
              if (newPage > 1) prefetchPreviousSalesOrdersPage();
            }}
          />
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex items-center flex-col flex-wrap md:flex-row gap-4 mb-6">
        <div className="w-full flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by Name..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Item Type Toggle */}
          <div className="flex items-center gap-2">
            <Label className="font-bold">Type:</Label>
            <div className="flex rounded-md border-black border-3 p-1 pb-2">
              <Button
                variant={itemType === "all" ? "default" : "ghost"}
                size="sm"
                onClick={() => setItemType("all")}
              >
                All
              </Button>
              <Button
                variant={itemType === "product" ? "default" : "ghost"}
                size="sm"
                onClick={() => setItemType("product")}
                className="h-8"
              >
                Products
              </Button>
              <Button
                variant={itemType === "raw_material" ? "default" : "ghost"}
                size="sm"
                onClick={() => setItemType("raw_material")}
                className="h-8"
              >
                Materials
              </Button>
            </div>
          </div>

          {/* Low Stock Toggle */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setLowStock(!lowStock)}
              className={`w-6 h-6 border-3 border-black flex items-center justify-center ${lowStock ? "bg-green-400" : "bg-white"
                } hover:bg-gray-100 transition-colors`}
            >
              {lowStock && <Check size={16} className="text-black" />}
            </button>
            <div className="text-sm font-bold text-black">Low Stock Only</div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Last Updated</TableHead>
              {(perms?.canEdit || perms?.canDelete) && (
                <TableHead>Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  <div className="mt-2">Loading inventory...</div>
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No inventory items found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((item) => {
                return (
                  <TableRow key={item._id}>
                    <TableCell className="font-medium">
                      {item.item.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.item_type.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{item.item.sku || "-"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{item.quantity}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.item.unit}</TableCell>
                    <TableCell>{formatPrice(item.item.price.toFixed(2))}</TableCell>
                    <TableCell>{formatDate(item.last_updated)}</TableCell>
                    {(perms?.canEdit || perms?.canDelete) && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {perms?.canEdit && (
                            <EditQuantityDialog
                              queryKey={queryKey}
                              item={item}
                            />
                          )}
                          {perms?.canDelete && <DeleteDialog item={item} />}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.pages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={data.pagination.page}
            totalPages={data.pagination.pages}
            onPageChange={(newPage) => {
              setPage(newPage);
              // Prefetch adjacent pages
              if (newPage < data.pagination.pages) prefetchNextPage();
              if (newPage > 1) prefetchPreviousPage();
            }}
          />
        </div>
      )}

      {/* Summary */}
      {data?.pagination && (
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredData.length} of {data.pagination.total} items
        </div>
      )}
    </div>
  );
}
