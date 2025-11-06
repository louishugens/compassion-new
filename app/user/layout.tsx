"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { RoleProtection } from "@/components/RoleProtection"
import type { Role } from "@/convex/auth"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Toaster } from "sonner"


export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // All authenticated users can access the user area
  // Role-specific pages will have their own RoleProtection
  const allowedRoles: Role[] = [
    "national_admin",
    "cluster_admin",
    "cdej_admin",
    "cdej_staff",
    "cdej_monitor",
    "beneficiary",
  ]
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments)

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse">Chargement...</div>
      </div>
    )
  }

  return (
    <RoleProtection allowedRoles={allowedRoles}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 sticky top-0 z-40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1" />
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </SidebarInset>
        <Toaster position="top-right" richColors />
      </SidebarProvider>
    </RoleProtection>
  )
}

