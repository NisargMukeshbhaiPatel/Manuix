"use client"

import { useState, useEffect } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/dialog"
import { Button } from "@/components/button"
import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Textarea } from "@/components/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { createFinanceTransaction, updateFinanceTransaction } from "@/actions/finance"
import { useToast } from "@/hooks/use-toast"
import { format } from "date-fns"

export function TransactionModal({ isOpen, onClose, transaction }) {
  const [formData, setFormData] = useState({
    type: "income",
    source_type: "Other",
    source_id: "",
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    category: "",
    payment_method: "",
    reference_number: "",
  })

  const { toast } = useToast()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (transaction) {
      setFormData({
        type: transaction.type,
        source_type: transaction.source_type,
        source_id: transaction.source_id || "",
        amount: transaction.amount.toString(),
        description: transaction.description,
        date: format(new Date(transaction.date), "yyyy-MM-dd'T'HH:mm"),
        category: transaction.category || "",
        payment_method: transaction.payment_method || "",
        reference_number: transaction.reference_number || "",
      })
    } else {
      setFormData({
        type: "income",
        source_type: "Other",
        source_id: "",
        amount: "",
        description: "",
        date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        category: "",
        payment_method: "",
        reference_number: "",
      })
    }
  }, [transaction])

  const createMutation = useMutation({
    mutationFn: createFinanceTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
      toast({
        title: "Success",
        description: "Transaction created successfully",
      })
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create transaction",
        variant: "destructive",
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateFinanceTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] })
      queryClient.invalidateQueries({ queryKey: ["summary"] })
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      })
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = {
      ...formData,
      amount: Number.parseFloat(formData.amount),
      date: new Date(formData.date).toISOString(),
    }

    if (transaction) {
      updateMutation.mutate({ id: transaction.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaction" : "Add New Transaction"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="source_type">Source Type</Label>
              <Select
                value={formData.source_type}
                onValueChange={(value) => setFormData({ ...formData, source_type: value, source_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter transaction description"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="datetime-local"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Sales, Marketing"
              />
            </div>

            <div>
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={formData.payment_method}
                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                placeholder="e.g., Credit Card, Cash"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reference_number">Reference Number</Label>
            <Input
              id="reference_number"
              value={formData.reference_number}
              onChange={(e) => setFormData({ ...formData, reference_number: e.target.value })}
              placeholder="e.g., REF001"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="bg-white text-black">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : transaction ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
