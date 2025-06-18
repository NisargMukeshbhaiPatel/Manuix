"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  Shield,
  LayoutDashboard,
  PackageSearch,
  Boxes,
  Warehouse,
  ShoppingCart,
  PackagePlus,
  Banknote,
  Bell,
  ListOrdered,
  User,
  LogOut,
} from "lucide-react";

import ManuixLogo from "@/components/logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/sidebar";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/" },
  { icon: PackageSearch, label: "Products", href: "/products" },
  { icon: ListOrdered, label: "Bill of Materials", href: "/bom" },
  { icon: Boxes, label: "Raw Materials", href: "/raw-materials" },
  { icon: Warehouse, label: "Inventory", href: "/inventory" },
  { icon: ShoppingCart, label: "Sales Orders", href: "/sales-orders" },
  { icon: PackagePlus, label: "Purchase Orders", href: "/purchases" },
  { icon: Banknote, label: "Finance", href: "/finance" },
  // { icon: Users, label: "Management", href: "/" },
];

export default function DashSidebar() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar
      className="border-r-4 border-black bg-white overflow-x-hidden"
      collapsible="icon"
    >
      <SidebarHeader className="px-3 py-3 border-b-4 border-black">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 h-10 w-full">
            {state === "expanded" && (
              <>
                <ManuixLogo width={40} height={40} />
                <span className="font-black text-xl tracking-tight">
                  MANUIX
                </span>
              </>
            )}
            <SidebarTrigger className="ml-auto" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="p-3">
        <SidebarMenu>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={`
                    border-2 border-black rounded-md mb-2
                    ${
                      isActive
                        ? "bg-yellow-300 shadow-[4px_4px_0px_0px_#000]"
                        : "hover:bg-gray-100 hover:shadow-[4px_4px_0px_0px_#000]"
                    }
                  `}
                  tooltip={state === "collapsed" ? item.label : undefined}
                >
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 p-2"
                  >
                    <item.icon />
                    {state === "expanded" && (
                      <span className="font-bold">{item.label}</span>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t-4 border-black">
        <div className="flex gap-3">
          <User className="h-8 w-8 bg-green-400 stroke-black stroke-2 p-1 shrink-0 shadow-[3px_3px_0_0_black] rounded-md" />
          {state === "expanded" && (
            <>
              <div>
                <p className="font-bold text-sm">{user?.name || "..."}</p>
                <p
                  className={`text-xs flex items-center ${
                    user?.role === "admin" ? "font-bold" : ""
                  }`}
                >
                  {user?.role === "admin" && (
                    <Shield className="w-4 h-4 text-green-500" />
                  )}
                  {user?.role || ".."}
                </p>
              </div>
              <LogOut
                onClick={signOut}
                className="shrink-0 ml-auto h-8 w-8 border-black border-2 p-1 shadow-[3px_3px_0_0_black] rounded-sm cursor-pointer"
              />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
