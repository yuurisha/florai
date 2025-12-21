
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserRole } from "../../../controller/userController";
console.log("test:",getUserRole)
import AdminTopNavbar from "../../../components/adminTopNavBar";

export default function AdminPage() {
  
  return (
    <div className="p-6">
      <div className="fixed top-0 left-0 w-full z-50">
      <AdminTopNavbar />
      </div>
      <div className="pt-20">
      <main className="p-6"></main>
      <h1 className="text-2xl font-bold mb-4">Manage Post</h1>
      
      {/* Add admin controls here */}
      </div>
    </div>
  );
}