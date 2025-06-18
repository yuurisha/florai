"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/controller/userController";
console.log("test:",getUserRole)
import AdminTopNavbar from "@/components/adminTopNavBar";

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // useEffect(() => {
  //   const checkRole = async () => {
  //     const role = await getUserRole();
  //     if (role === "admin") {
  //       setIsAdmin(true);
  //     } else {
  //       router.push("/login"); // or any fallback
  //     }
  //     setLoading(false);
  //   };

  //   checkRole();
  // }, []);

  // if (loading) return <div>Checking access...</div>;

  return (
    <div className="p-6">
      <div className="fixed top-0 left-0 w-full z-50">
      <AdminTopNavbar />
      </div>
      <div className="pt-20">
      <main className="p-6"></main>
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <p className="text-gray-700 mb-4">You have admin access.</p>
      {/* Add admin controls here */}
      </div>
    </div>
  );
}
