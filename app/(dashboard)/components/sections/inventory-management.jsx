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
import { AlertTriangle, Package, ShoppingCart, Wrench } from "lucide-react";
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

  // Separate products and raw materials
  const { products, rawMaterials } = useMemo(() => {
    if (!inventory?.data) return { products: [], rawMaterials: [] };
    
    const products = inventory.data.filter(item => item.item_type === "product");
    const rawMaterials = inventory.data.filter(item => item.item_type !== "product");
    
    return { products, rawMaterials };
  }, [inventory]);

  // Product stock levels data
  const productStockData = useMemo(() => {
    if (!products.length) return { labels: [], datasets: [] };

    const topProducts = products.slice(0, 8);

    return {
      labels: topProducts.map((item) => item.item.name || "Unknown Product"),
      datasets: [
        {
          label: "Product Quantity",
          data: topProducts.map((item) => Number(item.quantity)),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [products]);

  // Raw materials stock levels data
  const rawMaterialStockData = useMemo(() => {
    if (!rawMaterials.length) return { labels: [], datasets: [] };

    const topRawMaterials = rawMaterials.slice(0, 8);

    return {
      labels: topRawMaterials.map((item) => item.item.name || "Unknown Material"),
      datasets: [
        {
          label: "Raw Material Quantity",
          data: topRawMaterials.map((item) => Number(item.quantity)),
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
        },
      ],
    };
  }, [rawMaterials]);

  // Inventory value distribution (keeping this as is since it's already separated)
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

  // Statistics
  const stats = useMemo(() => {
    if (!inventory?.data) return { totalProducts: 0, totalRawMaterials: 0, totalValue: 0 };
    
    const totalProducts = products.reduce((sum, item) => sum + Number(item.quantity), 0);
    const totalRawMaterials = rawMaterials.reduce((sum, item) => sum + Number(item.quantity), 0);
    const totalValue = inventory.data.reduce((sum, item) => 
      sum + (Number(item.quantity) * (Number(item.item.price) || 0)), 0
    );
    
    return { 
      totalProducts, 
      totalRawMaterials, 
      totalValue,
      productCount: products.length,
      rawMaterialCount: rawMaterials.length
    };
  }, [inventory, products, rawMaterials]);

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.productCount} different products
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
            <Wrench className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRawMaterials}</div>
            <p className="text-xs text-muted-foreground">
              {stats.rawMaterialCount} different materials
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <Package className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Combined value
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock?.data?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card>
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
                  <AlertTitle className="flex items-center justify-between">
                    <span>{item.item.name || "Unknown Item"}</span>
                    <Badge variant="outline" className="text-xs">
                      {item.item_type === "product" ? "Product" : "Raw Material"}
                    </Badge>
                  </AlertTitle>
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

      {/* Stock Level Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Product Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              Product Stock Levels
            </CardTitle>
            <CardDescription>Top 8 products by quantity</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : products.length > 0 ? (
              <div className="h-[300px]">
                <Bar
                  data={productStockData}
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No product data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Raw Materials Stock Levels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-green-600" />
              Raw Material Stock Levels
            </CardTitle>
            <CardDescription>Top 8 raw materials by quantity</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : rawMaterials.length > 0 ? (
              <div className="h-[300px]">
                <Bar
                  data={rawMaterialStockData}
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
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No raw material data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Inventory Value Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Value Distribution</CardTitle>
          <CardDescription>Value comparison between products and raw materials</CardDescription>
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
    </div>
  );
}
