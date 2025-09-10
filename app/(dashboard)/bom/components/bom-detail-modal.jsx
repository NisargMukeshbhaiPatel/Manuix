"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/dialog";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { Button } from "@/components/button";
import { currency, formatDate, formatPrice } from "@/lib/utils";

export function BOMDetailModal({ bom, isOpen, onClose }) {
  if (!bom) return null;

  const totalCost = bom.items.reduce((sum, item) => {
    return sum + item.quantity * item.raw_material.price;
  }, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            Bill of Materials Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-black uppercase tracking-wide">
              Product Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-md">
              <div>
                <label className="text-sm font-bold text-black uppercase tracking-wider">
                  Product Name
                </label>
                <div className="text-lg font-black mt-1">
                  {bom.product.name}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-black uppercase tracking-wider">
                  SKU
                </label>
                <div className="mt-1">
                  <Badge>{bom.product.sku}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-black uppercase tracking-wider">
                  Unit Price
                </label>
                <div className="text-lg font-black mt-1">
                  {currency}{bom.product.price.toFixed(2)} per {bom.product.unit}
                </div>
              </div>
              <div>
                <label className="text-sm font-bold text-black uppercase tracking-wider">
                  Total Material Cost
                </label>
                <div className="text-lg font-black text-black bg-green-400 px-3 py-1 rounded-md border-2 border-black mt-1">
                  {formatPrice(totalCost.toFixed(2))}
                </div>
              </div>
            </div>
          </div>
          <Separator />

          {/* Components List */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black uppercase tracking-wide">
                Raw Materials
              </h3>
              <div className="text-sm text-muted-foreground">
                Total Cost:{" "}
                <span className="font-medium">{formatPrice(totalCost.toFixed(2))}</span>
              </div>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material Name</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bom.items.map((item, index) => {
                    const itemTotal = item.quantity * item.raw_material.price;
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item.raw_material.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell>{item.raw_material.unit}</TableCell>
                        <TableCell className="text-right">
                          {formatPrice(item.raw_material.price.toFixed(2))}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(itemTotal.toFixed(2))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          <Separator />

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-muted-foreground">
                Created
              </label>
              <div>{formatDate(bom.createdAt)}</div>
            </div>
            <div>
              <label className="font-medium text-muted-foreground">
                Last Updated
              </label>
              <div>{formatDate(bom.updatedAt)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
