"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { Leaf } from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import { RoleTogglePill } from "./RoleTogglePill"
import { getUserRole } from "@/controller/userController";
import { useEffect, useState } from "react";

const links = [
  { href: "/home", label: "Home" },
  { href: "/profile", label: "Profile" },
  { href: "/Dashboard", label: "Dashboard" },
  { href: "/Learning", label: "Learning" },
  { href: "/notifications", label: "Notification Centre" },
  { href: "/survey", label: "Survey" },
  { href: "/diary", label: "Diary" },
  { href: "/gamification", label: "Gamification" },
];

export default function TopNavbar() {
  const pathname = usePathname();
  const [role, setRole] = useState<"admin" | "user">("user")
useEffect(() => {
  getUserRole().then((r) => {
    if (r === "admin") {
      setRole("admin")
    } else {
      setRole("user")
    }
  })
}, [])

  return (
    <nav className="w-full bg-green-600 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Left: FlorAI logo */}
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-xl">FlorAI</span>
        </div>
        {role === "admin" && (
  <RoleTogglePill currentView="user" />
)}

        {/* Center: Navigation links */}
        <ul className="flex space-x-4">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded hover:bg-green-700 transition",
                  pathname === link.href ? "bg-green-700 font-semibold" : ""
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right: Notification Bell */}
        <div className="flex items-center">
          <NotificationBell />
        </div>

      </div>
    </nav>
  );
}
