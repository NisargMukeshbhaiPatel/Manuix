"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/card";
import { DatePickerWithRange } from "./date-picker-range";
import { getFinanceSummary } from "@/actions/finance";
import { formatPrice as formatCurrency } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { addDays, format } from "date-fns";

export function DashboardSummary({ perms }) {
  const [dateRange, setDateRange] = useState({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const { data: summary, isLoading } = useQuery({
    queryKey: [
      "summary",
      {
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : null,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
      },
    ],
    queryFn: () =>
      getFinanceSummary({
        startDate: dateRange?.from
          ? format(dateRange.from, "yyyy-MM-dd")
          : null,
        endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : null,
      }),
  });

  const summaryData = summary?.data;

  return (
    <div className="space-y-4">
      <div className="md:flex md:items-center justify-between">
        <h2 className="text-xl md:text-2xl font-bold">Financial Summary</h2>
        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
      </div>
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summaryData?.income || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(summaryData?.expenses || 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${(summaryData?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatCurrency(summaryData?.profit || 0)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
