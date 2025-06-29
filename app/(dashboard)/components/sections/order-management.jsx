"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Badge } from "@/components/badge";
import {
  useSalesOrders,
  usePurchaseOrders,
  useSalesOrderStats,
  usePurchaseOrderStats,
} from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/skeleton";
import { useMemo } from "react";
import { Line, Doughnut } from "react-chartjs-2";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 3,
  plugins: {
    legend: {
      position: "top",
    },
  },
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

const pieOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 3,
  plugins: {
    legend: {
      position: "right",
    },
  },
};

export function OrderManagement() {
  const { data: salesOrders, isLoading: salesLoading } = useSalesOrders({
    limit: 50,
  });
  const { data: purchaseOrders, isLoading: purchaseLoading } =
    usePurchaseOrders({ limit: 50 });
  const { data: salesStats } = useSalesOrderStats();
  const { data: purchaseStats } = usePurchaseOrderStats();

  const salesPipelineData = useMemo(() => {
    if (!salesOrders?.data) return { labels: [], datasets: [] };

    const statusMap = new Map();
    salesOrders.data.forEach((order) => {
      const status = order.status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statuses = ["draft", "completed", "cancelled"];
    const colors = [
      "rgba(245, 158, 11, 0.8)",
      "rgba(34, 197, 94, 0.8)",
      "rgba(239, 68, 68, 0.8)",
    ];
    const borderColors = [
      "rgb(245, 158, 11)",
      "rgb(34, 197, 94)",
      "rgb(239, 68, 68)",
    ];

    return {
      labels: statuses.map(
        (status) => status.charAt(0).toUpperCase() + status.slice(1),
      ),
      datasets: [
        {
          data: statuses.map((status) => statusMap.get(status) || 0),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
    };
  }, [salesOrders]);

  const purchaseOrderStatusData = useMemo(() => {
    if (!purchaseOrders?.data) return { labels: [], datasets: [] };

    const statusMap = new Map();
    purchaseOrders.data.forEach((order) => {
      const status = order.status;
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const statuses = ["draft", "placed", "received", "cancelled"];
    const colors = [
      "rgba(245, 158, 11, 0.8)",
      "rgba(59, 130, 246, 0.8)",
      "rgba(34, 197, 94, 0.8)",
      "rgba(239, 68, 68, 0.8)",
    ];
    const borderColors = [
      "rgb(245, 158, 11)",
      "rgb(59, 130, 246)",
      "rgb(34, 197, 94)",
      "rgb(239, 68, 68)",
    ];

    return {
      labels: statuses.map(
        (status) => status.charAt(0).toUpperCase() + status.slice(1),
      ),
      datasets: [
        {
          data: statuses.map((status) => statusMap.get(status) || 0),
          backgroundColor: colors,
          borderColor: borderColors,
          borderWidth: 2,
        },
      ],
    };
  }, [purchaseOrders]);

  const orderVolumeData = useMemo(() => {
    if (!salesOrders?.data || !purchaseOrders?.data) {
      return { labels: [], datasets: [] };
    }

    // Get last 6 months
    const months = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: monthNames[date.getMonth()],
        year: date.getFullYear(),
        month: date.getMonth()
      });
    }

    // Count sales orders by month
    const salesByMonth = months.map(({ year, month }) => {
      return salesOrders.data.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === year && orderDate.getMonth() === month;
      }).length;
    });

    // Count purchase orders by month
    const purchaseByMonth = months.map(({ year, month }) => {
      return purchaseOrders.data.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate.getFullYear() === year && orderDate.getMonth() === month;
      }).length;
    });

    return {
      labels: months.map(m => m.label),
      datasets: [
        {
          label: "Sales Orders",
          data: salesByMonth,
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.2)",
          tension: 0.1,
        },
        {
          label: "Purchase Orders",
          data: purchaseByMonth,
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          tension: 0.1,
        },
      ],
    };
  }, [salesOrders, purchaseOrders]);

  const topCustomers = useMemo(() => {
    if (!salesOrders?.data) return [];

    const customerMap = new Map();
    salesOrders.data.forEach((order) => {
      const customer = order.customer_name;
      // Use the pre-calculated orderTotal if available, otherwise calculate from items
      const total = order.orderTotal || 
        order.items?.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.price),
          0,
        ) || 0;
      customerMap.set(customer, (customerMap.get(customer) || 0) + total);
    });

    return Array.from(customerMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [salesOrders]);

  const topSuppliers = useMemo(() => {
    if (!purchaseOrders?.data) return [];

    const supplierMap = new Map();
    purchaseOrders.data.forEach((order) => {
      const supplier = order.supplier_name;
      const total =
        order.items?.reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.price),
          0,
        ) || 0;
      supplierMap.set(supplier, (supplierMap.get(supplier) || 0) + total);
    });

    return Array.from(supplierMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [purchaseOrders]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Sales Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>Sales order status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <div className="h-[250px]">
              <Doughnut data={salesPipelineData} options={pieOptions} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Purchase Order Status */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Order Status</CardTitle>
          <CardDescription>Purchase order status distribution</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseLoading ? (
            <Skeleton className="h-[250px] w-full" />
          ) : (
            <div className="h-[250px]">
              <Doughnut data={purchaseOrderStatusData} options={pieOptions} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Volume Trends */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Order Volume Trends</CardTitle>
          <CardDescription>Sales vs Purchase orders over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <Line data={orderVolumeData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
          <CardDescription>By order value</CardDescription>
        </CardHeader>
        <CardContent>
          {salesLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topCustomers.map((customer, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      #{index + 1}
                    </p>
                  </div>
                  <Badge variant="outline">
                    ${customer.value.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Suppliers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Suppliers</CardTitle>
          <CardDescription>By order value</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {topSuppliers.map((supplier, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{supplier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      #{index + 1}
                    </p>
                  </div>
                  <Badge variant="outline">
                    ${supplier.value.toLocaleString()}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
