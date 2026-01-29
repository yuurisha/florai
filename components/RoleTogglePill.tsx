"use client"

import Link from "next/link"
import { Shield, User } from "lucide-react"

interface RoleTogglePillProps {
  currentView: "admin" | "user"
}

export function RoleTogglePill({ currentView }: RoleTogglePillProps) {
  if (currentView === "admin") {
    return (
      <Link
        href="/home" // or your main user dashboard route
        className="
          flex items-center gap-1
          rounded-full border
          px-3 py-1
          text-sm font-medium
          text-gray-700
          hover:bg-gray-100
        "
      >
        <User className="h-4 w-4" />
        User View
      </Link>
    )
  }

  return (
    <Link
      href="/admin"
      className="
        flex items-center gap-1
        rounded-full border
        px-3 py-1
        text-sm font-medium
        text-red-700
        border-red-200
        hover:bg-red-50
      "
    >
      <Shield className="h-4 w-4" />
      Admin View
    </Link>
  )
}
