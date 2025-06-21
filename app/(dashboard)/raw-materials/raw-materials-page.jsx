"use client";

import { useState } from "react";
import { useQuery, useMutation  } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Plus, Edit, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/alert-dialog";
import { toast } from "@/hooks/use-toast";
import {
  getRawMaterials,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
} from "@/actions/raw-material";
import { formatPrice, formatDate } from "@/lib/utils";
import SearchInput from "@/components/search-input";
import MaterialForm from "./components/material-form";

export default function RawMaterialsPage() {
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);

  const queryClient = getQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["rawMaterials", currentPage, searchName],
    queryFn: () => getRawMaterials({ page: currentPage, name: searchName }),
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Raw material created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: error.messaage || "Failed to create raw material",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ _id, data }) => updateRawMaterial(_id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      setEditingMaterial(null);
      toast({
        title: "Raw material updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update raw material",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteRawMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rawMaterials"] });
      toast({
        title: "Raw material deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete raw material",
        variant: "destructive",
      });
    },
  });

  const handleCreate = (materialData) => {
    createMutation.mutate(materialData);
  };

  const handleUpdate = (materialData) => {
    if (editingMaterial) {
      updateMutation.mutate({ _id: editingMaterial._id, data: materialData });
    }
  };

  const handleDelete = (_id) => {
    deleteMutation.mutate(_id);
  };

  if (error) {
    return (
      <div className="mx-auto">
        <Card>
          <CardContent>
            <div className="text-center text-red-600">
              Error loading raw materials. Please try again.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center">
        <h1 className="text-3xl font-bold">Raw Materials Management</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Material
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Raw Material</DialogTitle>
            </DialogHeader>
            <MaterialForm
              onSubmit={handleCreate}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        <div>
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex-grow">
              <SearchInput
                value={searchName}
                onChange={setSearchName}
                placeholder="Search by Material Name..."
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {data?.pagination?.total
                ? `${data.pagination.total} total materials`
                : ""}
            </div>
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="text-center py-8">Loading materials...</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.data?.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No materials found
                      </TableCell>
                    </TableRow>
                  ) : (
                    data?.data?.map((material) => (
                      <TableRow key={material._id}>
                        <TableCell className="font-medium">
                          {material.name}
                        </TableCell>
                        <TableCell>{material.unit}</TableCell>
                        <TableCell>{formatPrice(material.price)}</TableCell>
                        <TableCell>{formatDate(material.createdAt)}</TableCell>
                        <TableCell>{formatDate(material.updatedAt)}</TableCell>
                        <TableCell className="text-right w-32">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingMaterial(material)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Material
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "
                                    {material.name}"? This action cannot be
                                    undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(material._id)}
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
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination?.pages > 1 && (
                <div className="flex justify-between items-center mt-6">
                  <div className="text-sm text-muted-foreground">
                    Page {currentPage} of {data.pagination.pages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) =>
                          Math.min(data.pagination.pages, prev + 1),
                        )
                      }
                      disabled={currentPage === data.pagination.pages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingMaterial}
        onOpenChange={() => setEditingMaterial(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Raw Material</DialogTitle>
          </DialogHeader>
          {editingMaterial && (
            <MaterialForm
              material={editingMaterial}
              onSubmit={handleUpdate}
              onCancel={() => setEditingMaterial(null)}
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
