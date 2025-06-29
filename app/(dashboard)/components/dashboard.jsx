import { redirect } from "next/navigation";
import { createServerPermissions } from "@/lib/rbac";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { ExecutiveSummary } from "./sections/executive-summary";
import { FinancialAnalytics } from "./sections/financial-analytics";
import { InventoryManagement } from "./sections/inventory-management";
import { OrderManagement } from "./sections/order-management";
import { ProductionBOM } from "./sections/production-bom";
import { BarChart3, Package, ShoppingCart, Wrench } from "lucide-react";

export default async function Dashboard() {
  const permissions = await createServerPermissions();
  const { canRead, role } = permissions;

  const canReadFinancial = canRead("finances");
  const canReadInventory = canRead("inventories");
  const canReadOrders = canRead("salesorders") || canRead("purchaseorders");
  const canReadProduction = canRead("products");

  if (role === "user") {
    redirect("/products");
  }

  const getDefaultTab = () => {
    if (canReadFinancial) return "financial";
    if (canReadInventory) return "inventory";
    if (canReadOrders) return "orders";
    if (canReadProduction) return "production";
    return "financial"; // fallback
  };

  const defaultTab = getDefaultTab();

  return (
    <div className="space-y-4">
      {/* Executive Summary - Visible to all dashboard users */}
      <ExecutiveSummary />

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {canReadFinancial && (
            <TabsTrigger value="financial" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Financial
            </TabsTrigger>
          )}
          {canReadInventory && (
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory
            </TabsTrigger>
          )}
          {canReadOrders && (
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
          )}
          {canReadProduction && (
            <TabsTrigger value="production" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Production
            </TabsTrigger>
          )}
        </TabsList>

        {canReadFinancial && (
          <TabsContent value="financial" className="space-y-4">
            <FinancialAnalytics />
          </TabsContent>
        )}

        {canReadInventory && (
          <TabsContent value="inventory" className="space-y-4">
            <InventoryManagement />
          </TabsContent>
        )}

        {canReadOrders && (
          <TabsContent value="orders" className="space-y-4">
            <OrderManagement />
          </TabsContent>
        )}

        {canReadProduction && (
          <TabsContent value="production" className="space-y-4">
            <ProductionBOM />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
