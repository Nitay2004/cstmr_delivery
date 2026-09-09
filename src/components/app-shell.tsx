"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { AuthHeader } from "@/components/auth-header";
import { useUser } from "@/components/user-provider";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const isPublic =
    pathname === "/login" || pathname === "/register";

  if (isPublic) {
    return <main className="flex min-h-full flex-col">{children}</main>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex w-full min-w-0 flex-1 flex-col overflow-x-clip">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="text-xl text-muted-foreground">
            Welcome back,{" "}
            <span className="font-semibold text-foreground">
              {user?.name ?? "there"}
            </span>
          </span>
          <div className="ml-auto">
            <AuthHeader />
          </div>
        </header>
        <div className="flex-1 p-4 md:p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}
