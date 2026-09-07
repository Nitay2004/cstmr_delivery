"use client";

import Link from "next/link";
import { StatCards } from "@/components/stat-cards";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileUp, PackageSearch, ArrowRight } from "lucide-react";
import { useUser, can } from "@/components/user-provider";

export default function DashboardPage() {
  const { user } = useUser();
  const canCreate = can(user, "createPickupRequest");
  const canImport = can(user, "importPickupRequests");
  const canViewRequests = can(user, "viewPickupRequests");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Welcome back. Here&apos;s an overview of your delivery operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canCreate && (
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/pickup-request" />}
            >
              <Upload className="size-4" />
              New Pickup Request
            </Button>
          )}
          {canImport && (
            <Button nativeButton={false} render={<Link href="/pickup-request" />}>
              <FileUp className="size-4" />
              Bulk Upload
            </Button>
          )}
        </div>
      </div>

      <StatCards />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Frequently used tasks to get your deliveries moving.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {canImport && (
              <Link
                href="/pickup-request"
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/50 hover:border-primary/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileUp className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Bulk Import CSV</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Import multiple pickup requests at once
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            )}

            {canViewRequests && (
              <Link
                href="/pickup-request"
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:bg-muted/50 hover:border-blue-500/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <PackageSearch className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Manage Requests</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    View and track all pickup requests
                  </p>
                </div>
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Tip</CardTitle>
            <CardDescription>
              Getting started with bulk uploads
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="flex gap-3 items-start">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                1
              </span>
              <p className="pt-0.5">Prepare a CSV with <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono border border-border/50">stage</code> and <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono border border-border/50">sourcingDealNo</code> columns.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                2
              </span>
              <p className="pt-0.5">Navigate to Pickup Request → Bulk Upload.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                3
              </span>
              <p className="pt-0.5">Upload the CSV and review the import summary.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}