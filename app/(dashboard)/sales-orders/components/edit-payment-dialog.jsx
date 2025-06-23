"use client";

import React, { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import getQueryClient from "@/lib/query-client";
import { Button } from "@/components/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/dialog";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { Textarea } from "@/components/textarea";
import { CreditCard } from "lucide-react";
import { updateSalesOrderPayment } from "@/actions/sales-order";

function EditPaymentDialog({ order }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: order.payment_amount,
    method: "",
    reference: "",
    notes: "",
  });

  const queryClient = getQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => updateSalesOrderPayment(data.id, data.paymentData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["salesOrders"] });
      setOpen(false);
    },
    onError: (e) => console.error(e),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate({
      id: order._id,
      paymentData: formData,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <CreditCard className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  amount: Number.parseFloat(e.target.value) || 0,
                }))
              }
              required
            />
          </div>

          <div className="flex justify-end gap-2">
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
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default EditPaymentDialog;
