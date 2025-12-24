"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Settings,
  MessageSquare,
  FileText,
  Users,
  Building2,
  Shield,
  LogOut,
  ChevronRight,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface SidebarItem {
  label: string
  href: string
  icon: React.ReactNode
}

const userItems: SidebarItem[] = [
  { label: "Dashboard", href: "/user/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "My Reviews", href: "/user/reviews", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Profile", href: "/user/profile", icon: <Users className="w-4 h-4" /> },
  { label: "Settings", href: "/user/settings", icon: <Settings className="w-4 h-4" /> },
]

const businessItems: SidebarItem[] = [
  { label: "Dashboard", href: "/business/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Profile", href: "/business/profile", icon: <Building2 className="w-4 h-4" /> },
  { label: "Reviews", href: "/business/reviews", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Documents", href: "/business/documents", icon: <FileText className="w-4 h-4" /> },
  { label: "Blog Posts", href: "/business/blog", icon: <FileText className="w-4 h-4" /> },
]

const adminItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: <BarChart3 className="w-4 h-4" /> },
  { label: "Users", href: "/admin/users", icon: <Users className="w-4 h-4" /> },
  { label: "Businesses", href: "/admin/businesses", icon: <Building2 className="w-4 h-4" /> },
  { label: "Categories", href: "/admin/categories", icon: <Shield className="w-4 h-4" /> },
  { label: "Best In Categories", href: "/admin/best-in-categories", icon: <Star className="w-4 h-4" /> },
  { label: "Documents", href: "/admin/documents", icon: <FileText className="w-4 h-4" /> },
  { label: "Reviews", href: "/admin/reviews", icon: <MessageSquare className="w-4 h-4" /> },
  { label: "Blog Posts", href: "/admin/blog", icon: <FileText className="w-4 h-4" /> },
]

export function Sidebar({ role = "user" }: { role?: "user" | "business" | "admin" }) {
  const pathname = usePathname()

  const getItems = () => {
    switch (role) {
      case "business":
        return businessItems
      case "admin":
        return adminItems
      default:
        return userItems
    }
  }

  const items = getItems()

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 border-r border-border bg-card overflow-y-auto hidden md:block z-50">
        <div className="p-4 space-y-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all",
                  pathname === item.href
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary",
                )}
              >
                {item.icon}
                <span className="flex-1 text-left text-sm">{item.label}</span>
                {pathname === item.href && <ChevronRight className="w-4 h-4" />}
              </button>
            </Link>
          ))}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <Button variant="outline" className="w-full gap-2 bg-transparent" size="sm">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation - Icon Only */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden z-50">
        <div className="flex justify-around items-center py-2">
          {items.map((item) => (
            <Link key={item.href} href={item.href} className="flex flex-col items-center py-2 px-3">
              <div className={cn(
                "p-2 rounded-lg",
                pathname === item.href
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              )}>
                {item.icon}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
