"use client";

import { AuthProvider, useAuth } from "../context/AuthContext";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

// // Optional global guard (keep or remove if you prefer per-page guards)
// function AuthGuard({ children }: { children: React.ReactNode }) {
//   const { user, loading } = useAuth();
//   const router = useRouter();
//   const pathname = usePathname();

//   const publicRoutes = ["/", "/login", "/signup", "/forgotPassword"];

//    const isPublic =
//     publicRoutes.includes(pathname) ||
//     pathname === "" ||
//     pathname === "/index"; 

//   useEffect(() => {
//     if (!loading && !user && !isPublic) {
//       router.push("/login");
//     }
//     else if (user && pathname === "/") {
//       router.push("/home");
//     }
//   }, [loading, user, pathname, router]);

//   if (loading) {
//     return (
//       <div className="flex h-screen items-center justify-center text-green-700">
//         Checking authentication...
//       </div>
//     );
//   }

//   return <>{children}</>;
// }

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
  {children}
    </AuthProvider>
  );
}
