"use client";

import TopNavBar from "@/components/TopNavBar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <TopNavBar />
      <main className="p-6 pt-20 text-center text-gray-600">
        {/* Optional placeholder */}
        <p>Welcome to FlorAI. Please use the navigation bar above to explore the app.</p>
      </main>
    </div>
  );
}
