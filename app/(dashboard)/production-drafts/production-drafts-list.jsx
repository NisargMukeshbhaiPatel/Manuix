"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { getProductionDrafts } from "@/actions/production-draft";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { Button } from "@/ui/components/button";
import { ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/ui/components/dialog";

import { updateProductionDraftQuantity, deleteProductionDraft, produceProductionDraft } from "@/actions/production-draft";

function ExpandableSection({ label, children }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-2">
      <div className="bg-red-50 border border-red-200 rounded-md p-3">
        <button
          className="flex items-center gap-2 font-semibold text-sm mb-2 px-2 py-1 rounded bg-transparent hover:bg-red-100 transition"
          onClick={() => setExpanded((e) => !e)}
          type="button"
          aria-expanded={expanded}
        >
          <span className="text-red-600">{expanded ? "▼" : "▶"} {label}</span>
        </button>
        {expanded && <div>{children}</div>}
      </div>
    </div>
  );
}

export default function ProductionDraftsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["production-drafts"],
    queryFn: getProductionDrafts,
    staleTime: 5 * 60 * 1000,
  });

  const drafts = data || [];
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [filter, setFilter] = useState("all");
  const [editDraftId, setEditDraftId] = useState(null);
  const [editQuantity, setEditQuantity] = useState("");
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const deleteMutation = useMutation({
    mutationFn: async (draftId) => {
      await deleteProductionDraft(draftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["production-drafts"]);
      setConfirmDeleteId(null);
    },
  });

  const produceMutation = useMutation({
    mutationFn: async (draftId) => {
      await produceProductionDraft(draftId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["production-drafts"]);
    },
  });

  const mutation = useMutation({
    mutationFn: async ({ draftId, quantity }) => {
      await updateProductionDraftQuantity(draftId, quantity);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["production-drafts"]);
      setEditDraftId(null);
      setEditQuantity("");
    },
  });

  // Filtering logic
  const filteredDrafts = drafts.filter((draft) => {
    const isProducible = draft.requiredMaterials.every(
      (rm) => rm.available >= rm.totalRequired
    );
    if (filter === "producible") return isProducible;
    if (filter === "nonproducible") return !isProducible;
    return true;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Drafted Products</CardTitle>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
            <Button size="sm" variant={filter === "producible" ? "default" : "outline"} onClick={() => setFilter("producible")}>Producible</Button>
            <Button size="sm" variant={filter === "nonproducible" ? "default" : "outline"} onClick={() => setFilter("nonproducible")}>Non-Producible</Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">Error: {error.message}</div>
          ) : filteredDrafts.length === 0 ? (
            <div>No drafted products found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Status / Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrafts.map((draft) => {
                  const isProducible = draft.requiredMaterials.every(
                    (rm) => rm.available >= rm.totalRequired
                  );
                  const missingItems = draft.requiredMaterials.filter(rm => rm.available < rm.totalRequired);
                  return (
                    <TableRow key={draft._id}>
                      <TableCell>{draft.product?.name || draft.product_id || "-"}</TableCell>
                      <TableCell>{draft.product?.sku || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start">
                          <span>{parseFloat(draft.quantity)}</span>
                          <Dialog open={editDraftId === draft._id} onOpenChange={open => { if (!open) { setEditDraftId(null); setEditQuantity(""); } }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => { setEditDraftId(draft._id); setEditQuantity(draft.quantity); }}
                              >
                                Edit
                              </Button>
                            </DialogTrigger>
                            <DialogContent style={{ maxWidth: "400px", width: "100%" }}>
                              <DialogHeader>
                                <DialogTitle>Edit Draft Quantity</DialogTitle>
                              </DialogHeader>
                              <div className="flex gap-2 items-center mt-4">
                                <input
                                  type="number"
                                  min={0}
                                  step={1}
                                  value={editQuantity}
                                  onChange={e => setEditQuantity(e.target.value)}
                                  className="border rounded px-2 py-1 w-24"
                                />
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => mutation.mutate({ draftId: draft._id, quantity: editQuantity })}
                                  disabled={mutation.isLoading || !editQuantity}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => { setEditDraftId(null); setEditQuantity(""); }}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-4">
                          <div className="flex gap-2 mt-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => setSelectedDraft(draft)}>
                                  View All Raw Materials
                                </Button>
                              </DialogTrigger>
                              <DialogContent style={{ maxWidth: "800px", width: "100%" }}>
                                <DialogHeader>
                                  <DialogTitle>Raw Materials for {draft.product?.name || draft.product_id || "-"}</DialogTitle>
                                </DialogHeader>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Name</TableHead>
                                      <TableHead>Required (per unit)</TableHead>
                                      <TableHead>Available</TableHead>
                                      <TableHead>Total Required</TableHead>
                                      <TableHead>Availability</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {draft.requiredMaterials.map((rm) => {
                                      const isAvailable = rm.available >= rm.totalRequired;
                                      return (
                                        <TableRow key={rm._id}>
                                          <TableCell>{rm.name}</TableCell>
                                          <TableCell>{rm.required} {rm.unit}</TableCell>
                                          <TableCell>{rm.available} {rm.unit}</TableCell>
                                          <TableCell>{rm.totalRequired} {rm.unit}</TableCell>
                                          <TableCell>
                                            {isAvailable ? (
                                              <span className="text-green-600 font-semibold">Available</span>
                                            ) : (
                                              <Link
                                                href={{
                                                  pathname: "/purchases/create",
                                                  query: {
                                                    id: rm._id,
                                                    quantitiy: rm.totalRequired - rm.available,
                                                  },
                                                }}
                                                passHref
                                              >
                                                <Button size="sm" variant="outline" className="flex items-center gap-1">
                                                  Order {rm.totalRequired - rm.available} {rm.unit}
                                                  <ExternalLink className="inline-block w-4 h-4" />
                                                </Button>
                                              </Link>
                                            )}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </DialogContent>
                            </Dialog>
                            <Dialog open={confirmDeleteId === draft._id} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setConfirmDeleteId(draft._id)}
                                  disabled={deleteMutation.isLoading}
                                >
                                  Delete Draft
                                </Button>
                              </DialogTrigger>
                              <DialogContent style={{ maxWidth: "400px", width: "100%" }}>
                                <DialogHeader>
                                  <DialogTitle>Confirm Delete</DialogTitle>
                                </DialogHeader>
                                <div className="my-4">Are you sure you want to delete this draft? This action cannot be undone.</div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteMutation.mutate(draft._id)}
                                    disabled={deleteMutation.isLoading}
                                  >
                                    Yes, Delete
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setConfirmDeleteId(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => produceMutation.mutate(draft._id)}
                              disabled={!isProducible || produceMutation.isLoading}
                            >
                              Produce Draft
                            </Button>
                          </div>
                          {missingItems.length > 0 && (
                            <ExpandableSection label={`Missing Items (${missingItems.length})`}>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Available</TableHead>
                                    <TableHead>Total Required</TableHead>
                                    <TableHead>Order</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {missingItems.map((rm) => (
                                    <TableRow key={rm._id}>
                                      <TableCell>{rm.name}</TableCell>
                                      <TableCell>{rm.available} {rm.unit}</TableCell>
                                      <TableCell>{rm.totalRequired} {rm.unit}</TableCell>
                                      <TableCell>
                                        <Link
                                          href={{
                                            pathname: "/purchases/create",
                                            query: {
                                              id: rm._id,
                                              quantitiy: rm.totalRequired - rm.available,
                                            },
                                          }}
                                          passHref
                                        >
                                          <Button size="sm" variant="outline" className="flex items-center gap-1">
                                            Order ({rm.totalRequired - rm.available} {rm.unit})
                                            <ExternalLink className="inline-block w-4 h-4" />
                                          </Button>
                                        </Link>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </ExpandableSection>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
