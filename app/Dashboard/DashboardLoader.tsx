"use client";

import dynamic from "next/dynamic";

const DashboardClient = dynamic(() => import("./DashboardClient"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      Loading dashboard…
    </div>
  ),
});

export default function DashboardLoader() {
  return <DashboardClient />;
}
