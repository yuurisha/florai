"use client";

import dynamic from "next/dynamic";

const MapBase = dynamic(() => import("./MapBase"), { ssr: false });

export default function MapClient({ mode }: { mode: "user" | "admin" }) {
  return <MapBase mode={mode} />;
}
