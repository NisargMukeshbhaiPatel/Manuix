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
import { Progress } from "@/components/progress";
import {
  useProducts,
  useProductsWithoutBOM,
  useBOMs,
  useRawMaterials,
} from "@/hooks/use-dashboard-data";
import { Skeleton } from "@/components/skeleton";
import { AlertTriangle, CheckCircle, XCircle, Package } from "lucide-react";
import { useMemo } from "react";
import { Pie, Bar, Doughnut } from "react-chartjs-2";

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

export function ProductionBOM() {
  const { data: products, isLoading: productsLoading } = useProducts({
    limit: 20,
  });
  const { data: productsWithoutBOM, isLoading: noBOMLoading } =
    useProductsWithoutBOM();
  const { data: boms, isLoading: bomsLoading } = useBOMs({ limit: 50 });
  const { data: rawMaterials, isLoading: materialsLoading } = useRawMaterials({
    limit: 50,
  });

  const bomCostData = useMemo(() => {
    if (!boms?.boms || !rawMaterials?.data) return { labels: [], datasets: [] };

    const costAnalysis = boms.boms.slice(0, 10).map((bom) => {
      const totalCost =
        bom.items?.reduce((sum, item) => {
          const material = rawMaterials.data.find(
            (m) => m._id === item.raw_material_id,
          );
          return sum + Number(item.quantity) * Number(material?.price || 0);
        }, 0) || 0;

      return {
        name: bom.product?.name || "Unknown Product",
        cost: totalCost,
        items: bom.items?.length || 0,
      };
    });

    return {
      labels: costAnalysis.map((item) => item.name),
      datasets: [
        {
          label: "Cost ($)",
          data: costAnalysis.map((item) => item.cost),
          backgroundColor: "rgba(139, 92, 246, 0.8)",
          borderColor: "rgb(139, 92, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [boms, rawMaterials]);

  // Product Price vs BOM Cost Analysis
  const profitabilityData = useMemo(() => {
    if (!boms?.boms || !rawMaterials?.data) return { labels: [], datasets: [] };

    const analysis = boms.boms.slice(0, 8).map((bom) => {
      const bomCost =
        bom.items?.reduce((sum, item) => {
          const material = rawMaterials.data.find(
            (m) => m._id === item.raw_material_id,
          );
          return sum + Number(item.quantity) * Number(material?.price || 0);
        }, 0) || 0;

      const productPrice = Number(bom.product?.price || 0);
      const profit = productPrice - bomCost;

      return {
        name: bom.product?.name || "Unknown",
        bomCost,
        productPrice,
        profit,
      };
    });

    return {
      labels: analysis.map((item) => item.name),
      datasets: [
        {
          label: "Product Price ($)",
          data: analysis.map((item) => item.productPrice),
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderColor: "rgb(34, 197, 94)",
          borderWidth: 1,
        },
        {
          label: "BOM Cost ($)",
          data: analysis.map((item) => item.bomCost),
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "rgb(239, 68, 68)",
          borderWidth: 1,
        },
        {
          label: "Profit ($)",
          data: analysis.map((item) => item.profit),
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgb(59, 130, 246)",
          borderWidth: 1,
        },
      ],
    };
  }, [boms, rawMaterials]);

  // BOM Complexity Distribution (number of items per BOM)
  const complexityData = useMemo(() => {
    if (!boms?.boms) return { labels: [], datasets: [] };

    const complexityRanges = {
      "1-3 items": 0,
      "4-6 items": 0,
      "7-10 items": 0,
      "11+ items": 0,
    };

    boms.boms.forEach((bom) => {
      const itemCount = bom.items?.length || 0;
      if (itemCount <= 3) complexityRanges["1-3 items"]++;
      else if (itemCount <= 6) complexityRanges["4-6 items"]++;
      else if (itemCount <= 10) complexityRanges["7-10 items"]++;
      else complexityRanges["11+ items"]++;
    });

    return {
      labels: Object.keys(complexityRanges),
      datasets: [
        {
          data: Object.values(complexityRanges),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(249, 115, 22)",
            "rgb(239, 68, 68)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [boms]);

  // Raw Material Usage Frequency
  const materialUsageData = useMemo(() => {
    if (!boms?.boms || !rawMaterials?.data) return { labels: [], datasets: [] };

    const materialCount = {};

    boms.boms.forEach((bom) => {
      bom.items?.forEach((item) => {
        const material = rawMaterials.data.find(
          (m) => m._id === item.raw_material_id,
        );
        if (material) {
          materialCount[material.name] =
            (materialCount[material.name] || 0) + 1;
        }
      });
    });

    const sortedMaterials = Object.entries(materialCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      labels: sortedMaterials.map(([name]) => name),
      datasets: [
        {
          label: "Times Used",
          data: sortedMaterials.map(([, count]) => count),
          backgroundColor: "rgba(168, 85, 247, 0.8)",
          borderColor: "rgb(168, 85, 247)",
          borderWidth: 1,
        },
      ],
    };
  }, [boms, rawMaterials]);

  // Cost Distribution Analysis
  const costDistributionData = useMemo(() => {
    if (!boms?.boms || !rawMaterials?.data) return { labels: [], datasets: [] };

    const costRanges = {
      "Under $50": 0,
      "$50 - $100": 0,
      "$100 - $200": 0,
      "$200 - $500": 0,
      "$500+": 0,
    };

    boms.boms.forEach((bom) => {
      const totalCost =
        bom.items?.reduce((sum, item) => {
          const material = rawMaterials.data.find(
            (m) => m._id === item.raw_material_id,
          );
          return sum + Number(item.quantity) * Number(material?.price || 0);
        }, 0) || 0;

      if (totalCost < 50) costRanges["Under $50"]++;
      else if (totalCost < 100) costRanges["$50 - $100"]++;
      else if (totalCost < 200) costRanges["$100 - $200"]++;
      else if (totalCost < 500) costRanges["$200 - $500"]++;
      else costRanges["$500+"]++;
    });

    return {
      labels: Object.keys(costRanges),
      datasets: [
        {
          data: Object.values(costRanges),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(249, 115, 22, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(147, 51, 234, 0.8)",
          ],
          borderColor: [
            "rgb(34, 197, 94)",
            "rgb(59, 130, 246)",
            "rgb(249, 115, 22)",
            "rgb(239, 68, 68)",
            "rgb(147, 51, 234)",
          ],
          borderWidth: 1,
        },
      ],
    };
  }, [boms, rawMaterials]);

  const productionReadiness = useMemo(() => {
    if (!products?.data || !boms?.boms) return { ready: 0, notReady: 0 };

    const productsWithBOM = new Set(
      boms.boms.map((bom) => bom.product?._id || bom.product),
    );
    const ready = products.data.filter((product) =>
      productsWithBOM.has(product._id),
    ).length;
    const notReady = products.data.length - ready;

    return { ready, notReady };
  }, [products, boms]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Products Without BOMs Alert */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Products Without BOMs
          </CardTitle>
          <CardDescription>
            Products that need BOM configuration for production
          </CardDescription>
        </CardHeader>
        <CardContent>
          {noBOMLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : productsWithoutBOM?.data?.length > 0 ? (
            <div className="space-y-2">
              {productsWithoutBOM.data.slice(0, 5).map((product, index) => (
                <Alert key={index} variant="destructive">
                  <Package className="h-4 w-4" />
                  <AlertTitle>{product.name}</AlertTitle>
                  <AlertDescription>
                    SKU: {product.sku} - Price: $
                    {Number(product.price).toFixed(2)}
                    <Badge variant="destructive" className="ml-2">
                      No BOM
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <p>All products have BOMs configured!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOM Cost Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>BOM Cost Analysis</CardTitle>
          <CardDescription>Material cost breakdown per product</CardDescription>
        </CardHeader>
        <CardContent>
          {bomsLoading || materialsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Bar
                data={bomCostData}
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

      {/* Profitability Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Profitability Analysis</CardTitle>
          <CardDescription>
            Product price vs BOM cost comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          {bomsLoading || materialsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Bar
                data={profitabilityData}
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

      {/* Production Readiness */}
      <Card>
        <CardHeader>
          <CardTitle>Production Readiness</CardTitle>
          <CardDescription>
            Products ready vs not ready for production
          </CardDescription>
        </CardHeader>
        <CardContent>
          {productsLoading || bomsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Ready for Production</span>
                </div>
                <Badge variant="default">{productionReadiness.ready}</Badge>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Not Ready</span>
                </div>
                <Badge variant="destructive">
                  {productionReadiness.notReady}
                </Badge>
              </div>

              <div className="pt-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Readiness</span>
                  <span>
                    {Math.round(
                      (productionReadiness.ready /
                        (productionReadiness.ready +
                          productionReadiness.notReady)) *
                        100,
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    (productionReadiness.ready /
                      (productionReadiness.ready +
                        productionReadiness.notReady)) *
                    100
                  }
                  className="h-2"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BOM Complexity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>BOM Complexity</CardTitle>
          <CardDescription>Distribution of BOM sizes</CardDescription>
        </CardHeader>
        <CardContent>
          {bomsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Doughnut
                data={complexityData}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Material Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Raw Materials</CardTitle>
          <CardDescription>Most frequently used materials</CardDescription>
        </CardHeader>
        <CardContent>
          {bomsLoading || materialsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Bar
                data={materialUsageData}
                options={{
                  ...chartOptions,
                  indexAxis: "y",
                  scales: {
                    x: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cost Distribution */}
      <Card className="md:col-span-2 lg:col-span-1">
        <CardHeader>
          <CardTitle>BOM Cost Distribution</CardTitle>
          <CardDescription>Products grouped by BOM cost ranges</CardDescription>
        </CardHeader>
        <CardContent>
          {bomsLoading || materialsLoading ? (
            <Skeleton className="h-[300px] w-full" />
          ) : (
            <div className="h-[300px]">
              <Pie
                data={costDistributionData}
                options={{
                  ...chartOptions,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                  },
                }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
