"use client";

import { useQuery } from "@tanstack/react-query";
import { getFinanceTransactions, getFinanceSummary } from "@/actions/finance";
import { getInventoryItems } from "@/actions/inventory";
import { getSalesOrders, getSalesOrderStats } from "@/actions/sales-order";
import {
  getPurchaseOrders,
  getPurchaseOrderStats,
} from "@/actions/purchase-order";
import { getProducts, getProductsWithoutBOM } from "@/actions/product";
import { getBOMs } from "@/actions/bom";
import { getRawMaterials } from "@/actions/raw-material";
import { addDays, format } from "date-fns";

export function useFinanceSummary() {
  return useQuery({
    queryKey: ["summary"],
    queryFn: () =>
      getFinanceSummary({
        startDate: format(addDays(new Date(), -30), "yyyy-MM-dd"),
        endDate: format(addDays(new Date(), 1), "yyyy-MM-dd"),
      }),
  });
}

export function useSalesOrderStats(period) {
  return useQuery({
    queryKey: ["sales-order-stats", period],
    queryFn: () => getSalesOrderStats({ period }),
  });
}

export function usePurchaseOrderStats(period) {
  return useQuery({
    queryKey: ["purchase-order-stats", period],
    queryFn: () => getPurchaseOrderStats({ period }),
  });
}

// Financial Analytics Hooks
export function useFinanceTransactions(params) {
  return useQuery({
    queryKey: ["finance-transactions", params],
    queryFn: () => getFinanceTransactions(params || {}),
  });
}

// Inventory Management Hooks
export function useInventoryItems(params) {
  return useQuery({
    queryKey: ["inventory-items", params],
    queryFn: () => getInventoryItems(params || {}),
  });
}

export function useLowStockItems() {
  return useQuery({
    queryKey: ["low-stock-items"],
    queryFn: () => getInventoryItems({ lowStock: true, limit: 10 }),
  });
}

// Order Management Hooks
export function useSalesOrders(params) {
  return useQuery({
    queryKey: ["sales-orders", params],
    queryFn: () => getSalesOrders(params || {}),
  });
}

export function usePurchaseOrders(params) {
  return useQuery({
    queryKey: ["purchase-orders", params],
    queryFn: () => getPurchaseOrders(params || {}),
  });
}

// Production & BOM Hooks
export function useProducts(params) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: () => getProducts(params || {}),
  });
}

export function useProductsWithoutBOM() {
  return useQuery({
    queryKey: ["products-without-bom"],
    queryFn: () => getProductsWithoutBOM({}),
  });
}

export function useBOMs(params) {
  return useQuery({
    queryKey: ["boms", params],
    queryFn: () => getBOMs(params || {}),
  });
}

export function useRawMaterials(params) {
  return useQuery({
    queryKey: ["raw-materials", params],
    queryFn: () => getRawMaterials(params || {}),
  });
}
