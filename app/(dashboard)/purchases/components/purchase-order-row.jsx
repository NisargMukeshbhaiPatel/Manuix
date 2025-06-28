import { useState } from "react";
import { Button } from "@/components/button";
import { Badge } from "@/components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/table";
import { ChevronDown, ChevronRight, Edit, Trash2 } from "lucide-react";

import { formatDate } from "@/lib/utils";

const getStatusColor = (status) => {
  const variants = {
    draft: "warning",
  };
  return <Badge variant={variants[status] || "default"}>{status}</Badge>;
};

export default function PurchaseOrderRow({ order, onEdit, onDelete }) {
  const [isOpen, setIsOpen] = useState(false);
  const canDelete = order.status === "draft" || order.status === "cancelled";
  const calculateTotal = () => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce(
      (total, item) => total + item.quantity * item.price,
      0,
    );
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <Button
            variant="ghost"
            className="p-0"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <ChevronDown className="h-6 w-6" />
            ) : (
              <ChevronRight className="h-6 w-6" />
            )}
          </Button>
        </TableCell>
        <TableCell className="font-medium">{order.supplier_name}</TableCell>
        <TableCell>
          <Badge className={getStatusColor(order.status)}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
        </TableCell>
        <TableCell>{formatDate(order.updatedAt)}</TableCell>
        <TableCell className="font-medium">
          ${calculateTotal().toFixed(2)}
        </TableCell>
        {(onEdit || onDelete) && (
          <TableCell className="text-right">
            <div className="flex gap-1 justify-end">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(order)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && canDelete && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onDelete(order._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </TableCell>
        )}
      </TableRow>
      {isOpen && (
        <TableRow>
          <TableCell colSpan={onEdit || onDelete ? 6 : 5} className="p-0">
            <div className="px-4 py-4 bg-gray-50">
              <h4 className="font-semibold mb-3">Items:</h4>
              <div className="rounded-md border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">
                          {item.raw_material.name}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.quantity} {item.raw_material.unit}
                        </TableCell>
                        <TableCell className="text-right">
                          ${item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ${(item.quantity * item.price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
