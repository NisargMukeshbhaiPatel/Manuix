"use client"

import { Input } from "@/components/input"
import { Label } from "@/components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/select"
import { DatePickerWithRange } from "./date-picker-range"
import { Button } from "@/components/button"
import { format } from "date-fns"
import { X } from "lucide-react"

export function TransactionFiltersComponent({ filters, onFiltersChange }) {
  const handleDateRangeChange = (dateRange) => {
    onFiltersChange({
      ...filters,
      startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : null,
      endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
      page: 1,
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: 10,
      type: null,
      startDate: null,
      endDate: null,
      refType: null,
      refId: null,
    })
  }

  const dateRange =
    filters.startDate && filters.endDate
      ? {
          from: new Date(filters.startDate),
          to: new Date(filters.endDate),
        }
      : undefined

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div>
        <Label htmlFor="refId">Search by Reference ID</Label>
        <Input
          id="refId"
          placeholder="Search by reference ID..."
          value={filters.refId || ""}
          onChange={(e) => onFiltersChange({ ...filters, refId: e.target.value || null, page: 1 })}
        />
      </div>

      <div className="space-y-2">
        <Label>Transaction Type</Label>
        <Select
          value={filters.type || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              type: value === "all" ? null : value,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Source Type</Label>
        <Select
          value={filters.refType || "all"}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              refType: value === "all" ? null : value,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="SalesOrder">Sales Order</SelectItem>
            <SelectItem value="PurchaseOrder">Purchase Order</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Date Range</Label>
        <DatePickerWithRange date={dateRange} setDate={handleDateRangeChange} />
      </div>

      <div className="flex items-end">
        <Button variant="outline" onClick={clearFilters} className="bg-white text-black">
          <X className="mr-2 h-4 w-4" />
          Clear Filters
        </Button>
      </div>
    </div>
  )
}
