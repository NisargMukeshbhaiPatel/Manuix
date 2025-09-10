"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { formatDate, formatPrice } from "@/lib/utils";

import { DeleteDialog } from "./components/delete-dialog";
import { Pagination } from "./components/pagination";
import { EditQuantityDialog } from "./components/edit-quantity-dialog";

export default function InventoryManagement({ perms }) {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [itemType, setItemType] = useState("all");
  const [lowStock, setLowStock] = useState(false);
  const limit = 10;

  const queryKey = [
    "inventory",
    { page, limit, itemType, lowStock, searchTerm },
  ];
  const queryClient = getQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      getInventoryItems({
        page,
        limit,
        itemType: itemType || undefined,
        lowStock: lowStock || undefined,
      }),
  });

  // Prefetch next page
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

  // Prefetch previous page
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

  return (
    <div className="space-y-6">
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
              className={`w-6 h-6 border-3 border-black flex items-center justify-center ${
                lowStock ? "bg-green-400" : "bg-white"
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
