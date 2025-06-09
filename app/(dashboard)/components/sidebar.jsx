"use client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  User,
  LogOut,
  ClipboardList,
  Cog,
  Factory,
  Home,
  LayoutDashboard,
  Menu,
  Package,
  ShoppingCart,
  Truck,
  Users,
  X,
} from "lucide-react";

import ManuixLogo from "@/components/logo";
import { Button } from "@/components/button";
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

// Navigation items with icons
const navItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Factory, label: "Production", href: "/production" },
  { icon: Package, label: "Inventory", href: "/inventory" },
  { icon: ClipboardList, label: "Orders", href: "/orders" },
  { icon: ShoppingCart, label: "Purchasing", href: "/purchasing" },
  { icon: Truck, label: "Shipping", href: "/shipping" },
  { icon: Users, label: "Employees", href: "/employees" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Cog, label: "Settings", href: "/settings" },
];

export default function DashSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <Sidebar className="border-r-4 border-black bg-white" collapsible="icon">
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
                    <item.icon className="h-4 w-4" />
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
        <div className="flex items-center gap-3">
          <User className="h-8 w-8 bg-green-400 stroke-black stroke-2 p-1 shrink-0 shadow-[3px_3px_0_0_black] rounded-md" />
          {state === "expanded" && (
            <>
              <div>
                <p className="font-bold text-sm">Username</p>
                <p className="text-xs">role</p>
              </div>
              <LogOut
                onClick={signOut}
                className="ml-auto h-8 w-8 border-black border-2 p-1 shadow-[3px_3px_0_0_black] rounded-sm cursor-pointer"
              />
            </>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
