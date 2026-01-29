"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ShieldCheck, ChevronDown } from "lucide-react"
import { RoleTogglePill } from "./RoleTogglePill"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/dropdownMenu"
import AdminReportBell from "@/components/adminReportBell";


const manageLinks = [
  { href: "/admin/manage-user", label: "Users" },
  { href: "/admin/manage-events", label: "Events" },
  { href: "/admin/manage-map", label: "Map" },
  { href: "/admin/manage-report", label: "Reports" },
]

const uploadLinks = [
  { href: "/manage-survey", label: "Survey" },
  { href: "/admin/manage-resources", label: "Learning Resources" },
]

export default function adminTopNavbar() {
  const pathname = usePathname()

  return (
    <nav className="w-full bg-gradient-to-r from-green-700 to-green-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo and branding */}
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-green-100" />
            <span className="font-bold text-xl tracking-tight">FlorAI Admin</span>
          </div>

          {/* Center section: Navigation links */}
          <div className="flex items-center gap-1">
            <Link
              href="/admin"
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                "hover:bg-green-900/50",
                pathname === "/admin" ? "bg-green-900 text-white shadow-sm" : "text-green-50 hover:text-white",
              )}
            >
              Home
            </Link>

            <DropdownMenu>
  <DropdownMenuTrigger
    className={cn(
      "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      "hover:bg-green-900/50 text-green-50 hover:text-white",
      "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-green-800",
    )}
  >
    Manage
    <ChevronDown className="w-4 h-4" />
  </DropdownMenuTrigger>

  <DropdownMenuContent
    align="center"
    className={cn(
      "z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg",
      "animate-in fade-in-0 zoom-in-95"
    )}
  >
    <div className="p-1">
      {manageLinks.map((link) => (
        <DropdownMenuItem key={link.href} asChild>
          <Link
            href={link.href}
            className={cn(
              "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none",
              "hover:bg-gray-100 focus:bg-gray-100",
              pathname === link.href && "bg-emerald-100 text-emerald-900"
            )}
          >
            {link.label}
          </Link>
        </DropdownMenuItem>
      ))}
    </div>
  </DropdownMenuContent>
</DropdownMenu>


            <DropdownMenu>
  <DropdownMenuTrigger
    className={cn(
      "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      "hover:bg-green-900/50 text-green-50 hover:text-white",
      "focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-green-800",
    )}
  >
    Upload
    <ChevronDown className="w-4 h-4" />
  </DropdownMenuTrigger>

    <DropdownMenuContent
        align="center"
        className={cn(
          "z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white shadow-lg",
          "animate-in fade-in-0 zoom-in-95"
        )}
      >
        <div className="p-1">
          {uploadLinks.map((link) => (
            <DropdownMenuItem key={link.href} asChild>
              <Link
                href={link.href}
                className={cn(
                  "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none",
                  "hover:bg-gray-100 focus:bg-gray-100",
                  pathname === link.href && "bg-emerald-100 text-emerald-900"
                )}
              >
                {link.label}
              </Link>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>

          </div>
          <AdminReportBell />
          <div className="flex items-center">
            <RoleTogglePill currentView="admin" />
          </div>
        </div>
      </div>
    </nav>
  )
}
