import Sidebar from "./sidebar";
import { createServerPermissions } from "@/lib/rbac";

const allNavItems = [
  {
    icon: "LayoutDashboard",
    label: "Dashboard",
    href: "/",
    collection: "dashboard",
  },
  {
    icon: "Warehouse",
    label: "Inventory",
    href: "/inventory",
    collection: "inventories",
  },
  {
    icon: "PackagePlus",
    label: "Purchase Order",
    href: "/purchases",
    collection: "purchaseorders",
  },
  {
    icon: "ShoppingCart",
    label: "Sales Order",
    href: "/sales-orders",
    collection: "salesorders",
  },
  {
    icon: "Banknote",
    label: "Finance",
    href: "/finance",
    collection: "finances",
  },
  {
    icon: "PackageSearch",
    label: "Product Listing",
    href: "/products",
    collection: "products",
  },
  {
    icon: "ListOrdered",
    label: "Bill of Materials",
    href: "/bom",
    collection: "boms",
  },
  {
    icon: "Boxes",
    label: "Raw Materials",
    href: "/raw-materials",
    collection: "rawmaterials",
  },
  {
    icon: "Shield",
    label: "User Management",
    href: "/user-management",
    collection: "users",
  },
];

export default async function ServerDashSidebar() {
  const { canRead, role } = await createServerPermissions();

  const filteredNavItems = allNavItems.filter((item) => {
    if (item.collection === "dashboard" && role !== "user") {
      return true;
    }
    return canRead(item.collection);
  });

  return <Sidebar navItems={filteredNavItems} />;
}
