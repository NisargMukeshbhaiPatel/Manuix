// import Sidebar from "./components/sidebar/sidebar";
import { SidebarProvider } from "@/components/sidebar";
import DashSidebar from './components/sidebar'

import { cookies } from "next/headers";

export default async function DashLayout({ children }) {
  // const cookieStore = await cookies();
  const defaultOpen = true;

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="flex h-screen w-full">
        <DashSidebar />
        <div className="flex-1 overflow-hidden">
          <main className="flex-1 pb-7 h-full overflow-y-auto pt-14 md:pt-8 px-4 md:px-8">
            <div className="max-w-5xl mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
