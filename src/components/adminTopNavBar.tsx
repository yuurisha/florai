"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

const adminLinks = [
  { href: "/admin", label: "Admin Home" },
  { href: "/admin/manage-user", label: "Manage Users" },
  { href: "/admin/manage-post", label: "Manage Posts" },
  { href: "/manage-survey", label: "Upload Survey" },
  { href: "/admin/manage-resources", label: "Upload Learning Resources" },
];

export default function AdminTopNavbar() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-green-800 text-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-white" />
          <span className="text-white font-bold text-xl">FlorAI Admin</span>
        </div>
        <ul className="flex space-x-4">
          {adminLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={cn(
                  "px-3 py-2 rounded hover:bg-green-900 transition",
                  pathname === link.href ? "bg-green-900 font-semibold" : ""
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
