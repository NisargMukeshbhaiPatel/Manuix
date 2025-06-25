"use client";
import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Button } from "@/components/button";
import { toast } from "@/hooks/use-toast";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { CreditCard } from "lucide-react";
import { updateSalesOrder } from "@/actions/sales-order";

export default function UpdatePaymentDialog({ order }) {
  const [open, setOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    payment_status: order.payment_status,
    payment_amount: order.payment_amount,
  });

  const queryClient = getQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => updateSalesOrder(order._id, data),
    onSuccess: (data) => {
      if (!data.success) throw new Error(data.error || data.message);
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      setOpen(false);
      toast({
        title: "Payment status updated successfully",
        variant: "default",
      });
    },
    onError: (e) => {
      toast({
        title:
          e.message || "Failed to update payment status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(paymentData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CreditCard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Payment Status</DialogTitle>
          <DialogDescription>
            Update payment status and amount for {order.customer_name}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_status">Payment Status</Label>
            <Select
              value={paymentData.payment_status}
              onValueChange={(value) =>
                setPaymentData((prev) => ({ ...prev, payment_status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment_amount">Payment Amount</Label>
            <Input
              id="payment_amount"
              type="number"
              step="0.01"
              value={paymentData.payment_amount}
              onChange={(e) =>
                setPaymentData((prev) => ({
                  ...prev,
                  payment_amount: parseFloat(e.target.value) || 0,
                }))
              }
              placeholder="0.00"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Updating..." : "Update Payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
