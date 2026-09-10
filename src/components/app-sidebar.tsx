"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { PackageOpen, Users, FileText, FileSignature, CreditCard, HardDrive, BadgeCheck, ClipboardList, LayoutGrid, LayoutDashboard, Database } from "lucide-react"

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
    items.push({ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard });
    if (can(user, "viewPickupRequests")) {
      items.push({ title: "Pickup Request", href: "/pickup-request", icon: PackageOpen });
    }
    if (can(user, "viewQuotes")) {
      items.push({ title: "Quotes", href: "/quotes", icon: FileText });
    }
    if (can(user, "viewPurchaseOrders")) {
      items.push({ title: "Purchase Orders", href: "/purchase-orders", icon: FileSignature });
    }
    if (can(user, "viewPayments")) {
      items.push({ title: "Payments", href: "/payments", icon: CreditCard });
    }
    if (can(user, "viewDataWiping")) {
      items.push({ title: "Data Wiping", href: "/data-wiping", icon: HardDrive });
    }
    if (can(user, "viewDataWipingMaster")) {
      items.push({ title: "Data Wiping Master", href: "/data-wiping-master", icon: Database });
    }
    if (can(user, "viewCertificate")) {
      items.push({ title: "Certificates", href: "/certificates", icon: BadgeCheck });
    }
    if (can(user, "viewGrn")) {
      items.push({ title: "Chain of Custody", href: "/grn", icon: ClipboardList });
    }
    if (can(user, "viewConsolidated")) {
      items.push({ title: "Consolidated", href: "/consolidated", icon: LayoutGrid });
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
              <div className="flex aspect-square size-11 shrink-0 items-center justify-center overflow-hidden rounded-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.jpg"
                  alt="Deshwal-Optum"
                  className="size-full object-cover"
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-semibold text-foreground">Customer Portal</span>
                <span className="text-xs font-medium text-muted-foreground">
                  Deshwal-Optum
                </span>
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