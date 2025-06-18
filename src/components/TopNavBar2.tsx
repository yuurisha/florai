"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; // Optional: your class merging util

const navItems = [
  { label: "Home", href: "/home" },
  { label: "Profile", href: "/profile" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Learning", href: "/learning" },
  { label: "Notification Centre", href: "/notifications" },
  { label: "Survey", href: "/survey" },
  { label: "Diary", href: "/diary" },
];

export default function TopNavBar() {
  const pathname = usePathname();

  return (
    <nav className="bg-green-600 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <div className="text-lg font-semibold">FlorAI</div>

          {/* Navigation Links */}
          <div className="flex space-x-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition",
                  pathname === item.href ? "bg-green-700" : ""
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
