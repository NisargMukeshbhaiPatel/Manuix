import { SidebarProvider } from "@/components/sidebar";
import DashSidebar from "./components/sidebar-server";

import { cookies } from "next/headers";

export default async function DashLayout({ children }) {
  const cookieStore = await cookies();
  const defaultClose = cookieStore.get("sidebar:state")?.value === "false";

  return (
    <SidebarProvider defaultOpen={!defaultClose}>
      <div className="flex h-screen w-full">
        <DashSidebar />
        <div className="flex-1 overflow-hidden">
          <main className="flex-1 h-full overflow-y-auto pb-4 pt-7 px-4 md:py-10 md:px-8">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
