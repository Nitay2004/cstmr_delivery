"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, PackageOpen, Users } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useUser, can } from "@/components/user-provider"

export function AppSidebar() {
  const pathname = usePathname()
  const { user } = useUser()

  const navItems = React.useMemo(() => {
    const items: {
      title: string;
      href: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];
    if (can(user, "viewDashboard")) {
      items.push({ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    }
    if (can(user, "viewPickupRequests")) {
      items.push({ title: "Pickup Request", href: "/pickup-request", icon: PackageOpen });
    }
    if (can(user, "manageUsers")) {
      items.push({ title: "Users", href: "/users", icon: Users });
    }
    return items;
  }, [user]);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/dashboard" />}>
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <PackageOpen className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-foreground">Customer Portal</span>
                <span className="text-xs text-muted-foreground">Welcome</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={isActive}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                  >
                    <item.icon className="size-4" />
                    <span className="font-medium">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  )
}