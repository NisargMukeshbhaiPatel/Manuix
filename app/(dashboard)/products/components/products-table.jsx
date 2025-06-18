"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/actions/product";

import { Button } from "@/components/button";
import {
  Card,
  CardFooter,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Badge } from "@/components/badge";
import {
  Eye,
  Edit,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Trash2,
} from "lucide-react";
import { Skeleton } from "@/components/skeleton";
import ProductViewModal from "./product-view-modal";
import ProductEditModal from "./product-edit-modal";
import SearchInput from "./search-input";

import CreateProductModal from "./create-product-modal";
import DeleteConfirmationDialog from "./delete-confirmation-dialog";

export default function ProductsTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const queryKey = ["products", currentPage, searchTerm];
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getProducts({ page: currentPage, name: searchTerm }),
  });

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setIsViewModalOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading products. Please try again.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Total: {data?.pagination.total || "¯\\_(ツ)_/¯"}
              </p>
            </div>
            <div className="w-full sm:w-80">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Product Name"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Product
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-3 pt-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex gap-3 pb-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <div className="flex gap-3">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data?.data.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {searchTerm ? (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground mb-4">
                  No products match your search for "{searchTerm}". Try
                  adjusting your search terms.
                </p>
                <Button
                  variant="outline"
                  onClick={() => handleSearchChange("")}
                >
                  Clear search
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  No products found
                </h3>
                <p className="text-muted-foreground">
                  Get started by adding your first product.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.data.map((product) => (
            <Card key={product._id} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {product.sku}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      per {product.unit}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {product.description}
                </p>

                <div className="space-y-2 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span>{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Updated:</span>
                    <span>{formatDate(product.updatedAt)}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="gap-4 mt-auto flex flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewProduct(product)}
                >
                  <Eye className="h-4 w-4" />
                  View
                </Button>
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEditProduct(product)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDeleteProduct(product)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.pages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.pages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handlePageChange(
                      Math.min(data.pagination.pages, currentPage + 1),
                    )
                  }
                  disabled={currentPage === data.pagination.pages || isLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ProductViewModal
        product={selectedProduct}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />

      <ProductEditModal
        product={selectedProduct}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        queryKey={queryKey}
      />
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <DeleteConfirmationDialog
        product={productToDelete}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        queryKey={queryKey}
      />
    </div>
  );
}
