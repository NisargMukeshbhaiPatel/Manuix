"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/table";
import { getProductionDrafts } from "@/actions/production-draft";
import { getProductById } from "@/actions/product";
import { getBOMByProductId } from "@/actions/bom";
import { getRawMaterialById } from "@/actions/raw-material";
import { useState, useEffect } from "react";

export default function ProductionDraftsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["production-drafts"],
    queryFn: getProductionDrafts,
    staleTime: 5 * 60 * 1000,
  });

  const [drafts, setDrafts] = useState([]);

  useEffect(() => {
    async function fetchDetails() {
      if (!data?.data) return;
      const details = await Promise.all(
        data.data.map(async (draft) => {
          const product = await getProductById(draft.product_id);
          const bom = await getBOMByProductId(draft.product_id);
          const rawMaterials = await Promise.all(
            bom.items.map(async (item) => {
              const material = await getRawMaterialById(item.raw_material_id);
              return {
                ...material,
                required: item.quantity * parseFloat(draft.quantity),
              };
            })
          );
          return {
            ...draft,
            product,
            rawMaterials,
          };
        })
      );
      setDrafts(details);
    }
    fetchDetails();
  }, [data]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Drafted Products</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : error ? (
            <div className="text-red-600">Error: {error.message}</div>
          ) : drafts.length === 0 ? (
            <div>No drafted products found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Raw Materials Required</TableHead>
                  <TableHead>Raw Materials Present</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drafts.map((draft) => (
                  <TableRow key={draft._id}>
                    <TableCell>{draft.product?.name || "-"}</TableCell>
                    <TableCell>{parseFloat(draft.quantity)}</TableCell>
                    <TableCell>{draft.rawMaterials.length}</TableCell>
                    <TableCell>{draft.rawMaterials.filter(rm => rm.stock >= rm.required).length}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
