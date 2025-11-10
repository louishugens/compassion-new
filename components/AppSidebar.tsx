"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useAuth } from "@workos-inc/authkit-nextjs/components"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  BookOpen,
  BookPlus,
  List,
  FileQuestion,
  Building2,
  Users,
  LayoutDashboard,
  LogOut,
  ChevronUp,
  User2,
  Settings,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Role } from "@/convex/auth"

// Navigation items based on roles
const navigationGroups = [
  {
    label: "Principal",
    items: [
      {
        title: "Tableau de bord",
        url: "/user",
        icon: LayoutDashboard,
        roles: ["national_admin", "cluster_admin", "cdej_admin", "cdej_staff", "cdej_monitor"] as Role[],
      },
    ],
  },
  {
    label: "Leçons",
    items: [
      {
        title: "Créer une leçon",
        url: "/user/lessons/create",
        icon: BookPlus,
        roles: ["national_admin", "cluster_admin", "cdej_admin", "cdej_staff"] as Role[],
      },
      {
        title: "Voir les leçons",
        url: "/user/lessons",
        icon: BookOpen,
        roles: ["national_admin", "cluster_admin", "cdej_admin", "cdej_staff", "cdej_monitor"] as Role[],
      },
    ],
  },
  {
    label: "Quiz",
    items: [
      {
        title: "Créer un quiz",
        url: "/user/quizzes/create",
        icon: FileQuestion,
        roles: ["national_admin", "cluster_admin", "cdej_admin", "cdej_staff"] as Role[],
      },
      {
        title: "Voir les quiz",
        url: "/user/quizzes",
        icon: List,
        roles: ["national_admin", "cluster_admin", "cdej_admin", "cdej_staff", "cdej_monitor"] as Role[],
      },
    ],
  },
  {
    label: "Administration",
    items: [
      {
        title: "Gérer les clusters",
        url: "/user/admin/clusters",
        icon: Building2,
        roles: ["national_admin"] as Role[],
      },
      {
        title: "Gérer les CDEJ",
        url: "/user/admin/cdejes",
        icon: Users,
        roles: ["national_admin", "cluster_admin"] as Role[],
      },
      {
        title: "Gérer les utilisateurs",
        url: "/user/admin/users",
        icon: User2,
        roles: ["national_admin", "cluster_admin", "cdej_admin"] as Role[],
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user, signOut } = useAuth()
  const currentUser = useQuery(api.users.getCurrentUserWithAssignments)

  const handleSignOut = async () => {
    await signOut()
  }

  // Filter navigation items based on user role
  const filteredNavigationGroups = React.useMemo(() => {
    if (!currentUser) return []

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.roles.includes(currentUser.role)
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [currentUser])

  if (!currentUser) {
    return null
  }

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/user">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  <Image
                    src="/icon1.png"
                    alt="Compassion"
                    width={24}
                    height={24}
                    className="w-full h-full rounded-lg"
                  />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Compassion</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Haiti
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {filteredNavigationGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive = pathname === item.url || pathname?.startsWith(item.url + "/")
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-800 text-white">
                    <User2 className="h-4 w-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentUser.firstName} {currentUser.lastName}
                    </span>
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      {currentUser.role.replace(/_/g, " ")}
                    </span>
                  </div>
                  <ChevronUp className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuItem asChild>
                  <Link href="/user/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

