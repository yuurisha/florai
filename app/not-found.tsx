"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function NotFound() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (!user) return null; // prevent flashing

  return (
    <div className="flex h-screen items-center justify-center flex-col text-center p-4">
      <h1 className="text-4xl font-semibold text-red-600">404</h1>
      <p className="mt-2 text-lg text-gray-700">
        Oops!Page not found or does not exist.
      </p>
      <button
        onClick={() => router.push("/home")}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
      >
        Go back home
      </button>
    </div>
  );
}
