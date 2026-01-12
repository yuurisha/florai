"use client";

import dynamic from "next/dynamic";
import { GreenSpace } from "@/models/greenSpace";

const MapBase = dynamic(() => import("./MapBase"), { ssr: false });

type MapClientProps = {
  mode: "user" | "admin";
  onZoneSelect?: (zone: GreenSpace | null) => void;
  refreshKey?: number;
};

export default function MapClient({ mode, onZoneSelect, refreshKey }: MapClientProps) {
  return <MapBase mode={mode} onZoneSelect={onZoneSelect} refreshKey={refreshKey} />;
}
