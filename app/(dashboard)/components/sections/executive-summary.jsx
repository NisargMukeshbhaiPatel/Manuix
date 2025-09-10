"use client";

import {
  Card,
  CardDescription,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Badge } from "@/components/badge";
import { Skeleton } from "@/components/skeleton";
import {
  useFinanceSummary,
  useSalesOrderStats,
  usePurchaseOrderStats,
} from "@/hooks/use-dashboard-data.js";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Target,
  ShoppingBag,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export function ExecutiveSummary() {
  const { data: financeSummary, isLoading: financeLoading } =
    useFinanceSummary();
  const { data: salesStats, isLoading: salesLoading } =
    useSalesOrderStats("month");
  const { data: purchaseStats, isLoading: purchaseLoading } =
    usePurchaseOrderStats("month");

  const revenue = financeSummary?.data?.income || 0;
  const expenses = financeSummary?.data?.expenses || 0;
  const netProfit = financeSummary?.data?.profit || 0;
  const profitMargin = revenue > 0 ? ((revenue - expenses) / revenue) * 100 : 0;
  const activeOrders =
    (salesStats?.data?.total_orders || 0) +
    (purchaseStats?.data?.total_orders || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-wrap flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <CardDescription>For past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatPrice(Number(revenue.toFixed(2)))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
          <CardDescription>For past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {formatPrice(Number(expenses.toFixed(2)))}
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-wrap flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Profit Margin</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
          <CardDescription>
            Net Profit: {formatPrice(Number(netProfit?.toFixed(2)))}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {financeLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">
                {profitMargin.toFixed(1)}%
              </div>
              <Badge
                variant={
                  profitMargin > 20
                    ? "success"
                    : profitMargin > 10
                      ? "warning"
                      : "destructive"
                }
              >
                {profitMargin > 20
                  ? "Excellent"
                  : profitMargin > 10
                    ? "Good"
                    : "Needs Attention"}
              </Badge>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          <ShoppingBag className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {salesLoading || purchaseLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <>
              <div className="text-2xl font-bold">{activeOrders}</div>
              <p className="text-xs text-muted-foreground">
                {salesStats?.data?.total_orders || 0} sales +{" "}
                {purchaseStats?.data?.total_orders || 0} purchase
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
