"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/card";
import { Badge } from "@/components/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/alert";
import {
  useInventoryItems,
  useLowStockItems,
} from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/skeleton";
import { AlertTriangle, Package } from "lucide-react";
import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  devicePixelRatio: 2,
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
  devicePixelRatio: 3,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: "right",
    },
  },
};

export function InventoryManagement() {
  const { data: inventory, isLoading: inventoryLoading } = useInventoryItems({
    limit: 50,
  });
  const { data: lowStock, isLoading: lowStockLoading } = useLowStockItems();

  const stockLevelsData = useMemo(() => {
    if (!inventory?.data) return { labels: [], datasets: [] };

    const items = inventory.data.slice(0, 10);

    return {
      labels: items.map((item) => item.item.name || "Unknown Item"),
      datasets: [
        {
          label: "Quantity",
          data: items.map((item) => Number(item.quantity)),
          backgroundColor: "rgba(139, 92, 246, 0.8)",
          borderColor: "rgb(139, 92, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [inventory]);

  const inventoryValueData = useMemo(() => {
    if (!inventory?.data) return { labels: [], datasets: [] };

    const typeMap = new Map();
    inventory.data.forEach((item) => {
      const type = item.item_type === "product" ? "Products" : "Raw Materials";
      const value = Number(item.quantity) * (Number(item.item.price) || 0);
      typeMap.set(type, (typeMap.get(type) || 0) + value);
    });

    const entries = Array.from(typeMap.entries());

    return {
      labels: entries.map(([name]) => name),
      datasets: [
        {
          data: entries.map(([, value]) => value),
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)",
            "rgba(34, 197, 94, 0.8)",
          ],
          borderColor: ["rgb(59, 130, 246)", "rgb(34, 197, 94)"],
          borderWidth: 2,
        },
      ],
    };
  }, [inventory]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Low Stock Alerts */}
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Low Stock Alerts
          </CardTitle>
          <CardDescription>Items requiring immediate attention</CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : lowStock?.data?.length > 0 ? (
            <div className="space-y-2">
              {lowStock.data.slice(0, 5).map((item, index) => (
                <Alert key={index} variant="destructive">
                  <Package className="h-4 w-4" />
                  <AlertTitle>{item.item.name || "Unknown Item"}</AlertTitle>
                  <AlertDescription>
                    Current stock: {Number(item.quantity)}{" "}
                    {item.item.unit || "units"}
                    <Badge variant="destructive" className="ml-2">
                      Low Stock
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">
              No low stock items at the moment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Current Stock Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Current Stock Levels</CardTitle>
          <CardDescription>Top 10 items by quantity</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Bar
                data={stockLevelsData}
                options={{
                  ...chartOptions,
                  scales: {
                    x: {
                      ticks: {
                        maxRotation: 45,
                        minRotation: 45,
                      },
                    },
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Value Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Value Distribution</CardTitle>
          <CardDescription>Value across product categories</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Doughnut data={inventoryValueData} options={pieOptions} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inventory Turnover 
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Inventory Turnover Analysis</CardTitle>
          <CardDescription>Fast vs slow-moving items</CardDescription>
        </CardHeader>
        <CardContent>
          {inventoryLoading ? (
            <Skeleton className="h-[200px] w-full" />
          ) : (
            <div className="space-y-4">
              {turnoverData.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      Turnover Rate: {item.turnover.toFixed(1)}x per month
                    </p>
                  </div>
                  <Badge variant={item.status === "Fast Moving" ? "default" : "secondary"}>{item.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
	  */}
    </div>
  );
}
