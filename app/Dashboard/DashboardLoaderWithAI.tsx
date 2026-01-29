"use client";

import dynamic from "next/dynamic";

const DashboardClientWithAI = dynamic(() => import("./DashboardClientWithAI"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      Loading AI-powered dashboard…
    </div>
  ),
});

export default function DashboardLoaderWithAI() {
  return <DashboardClientWithAI />;
}
