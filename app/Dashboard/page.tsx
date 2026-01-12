"use client";

import { useState, useEffect } from "react";
import MapClient from "@/components/MapClient"; // Adjust the path based on where your file is
import Link from "next/link";
import {
  Download,
  FileText,
  MapPin,
  Cloud,
  BarChart3,
  User,
  Settings,
  LogOut,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Leaf,
  X,
  Menu,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card";
import { Input } from "../../components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/tabs";

import dynamic from "next/dynamic";

import TopNavBar from "../../components/TopNavBar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";
import { fetchGreenSpaces } from "@/controller/greenSpaceController";
import { GreenSpace } from "@/models/greenSpace";

export default function DashboardPage() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "weather">("map");
const MapViewer = dynamic(() => import("../../components/MapViewer"), { ssr: false });

  const [weather, setWeather] = useState({
    temperature: "--",
    humidity: "--",
    rainfall: "--",
  });

  const [spreadDetails, setSpreadDetails] = useState({
    riskLevel: "--",
    spreadDistance: "--",
  });

  const [lastResult, setLastResult] = useState<null | {
  latitude: string | number;
  longitude: string | number;
  temperature: string | number;
  humidity: string | number;
  rainfall: string | number;
  riskLevel: string;
  spreadDistance: string | number;
  createdAt: string; // ISO string
}>(null);



  //handle user session auth explicitly
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // User is not signed in, redirect to login
        window.location.href = "/login";
      }
    });
    return () => unsubscribe();
  }, []);

  // Responsive check
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const [location, setLocation] = useState({
  latitude: "--",
  longitude: "--",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [retryFn, setRetryFn] = useState<null | (() => void)>(null);
  const [greenSpaces, setGreenSpaces] = useState<GreenSpace[]>([]);
  const [greenSpacesLoading, setGreenSpacesLoading] = useState(true);
  const [greenSpacesError, setGreenSpacesError] = useState<string | null>(null);

  const getHealthLabel = (zone: GreenSpace) => {
    const total = zone.totalUploads ?? 0;
    if (total === 0) return "No data";
    if ((zone.healthIndex ?? 0) >= 0.8) return "Healthy";
    if ((zone.healthIndex ?? 0) >= 0.6) return "Moderate";
    return "Unhealthy";
  };

  const getHealthPercent = (zone: GreenSpace) => {
    const total = zone.totalUploads ?? 0;
    if (total === 0) return "--";
    return `${Math.round((zone.healthIndex ?? 0) * 100)}%`;
  };

  const greenSpaceSummary = greenSpaces.reduce(
    (acc, zone) => {
      const label = getHealthLabel(zone);
      if (label === "Healthy") acc.healthy += 1;
      else if (label === "Moderate") acc.moderate += 1;
      else if (label === "Unhealthy") acc.unhealthy += 1;
      else acc.noData += 1;
      return acc;
    },
    { healthy: 0, moderate: 0, unhealthy: 0, noData: 0 }
  );

  useEffect(() => {
  const hasRealData =
    location.latitude !== "--" &&
    weather.temperature !== "--" &&
    spreadDetails.riskLevel !== "--";

  if (!hasRealData) return;

  setLastResult({
    latitude: location.latitude,
    longitude: location.longitude,
    temperature: weather.temperature,
    humidity: weather.humidity,
    rainfall: weather.rainfall,
    riskLevel: spreadDetails.riskLevel,
    spreadDistance: spreadDetails.spreadDistance,
    createdAt: new Date().toISOString(),
  });
}, [location, weather, spreadDetails]);

  useEffect(() => {
    let active = true;
    setGreenSpacesLoading(true);
    setGreenSpacesError(null);

    fetchGreenSpaces()
      .then((data) => {
        if (!active) return;
        setGreenSpaces(data);
      })
      .catch((err) => {
        if (!active) return;
        console.error("Failed to load green spaces:", err);
        setGreenSpacesError("Failed to load green spaces.");
      })
      .finally(() => {
        if (!active) return;
        setGreenSpacesLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

const exportToPDF = async () => {
  if (!lastResult) return;

  // ✅ load jsPDF only in browser (avoids "window is not defined" during Vercel build)
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF();
  const title = "GreenTrack Prediction Report (UI Point)";
  const y0 = 18;

  doc.setFontSize(16);
  doc.text(title, 14, y0);

  doc.setFontSize(11);
  const lines = [
    `Created At: ${lastResult.createdAt}`,
    `Latitude: ${lastResult.latitude}`,
    `Longitude: ${lastResult.longitude}`,
    `Temperature: ${lastResult.temperature}`,
    `Humidity: ${lastResult.humidity}`,
    `Rainfall: ${lastResult.rainfall}`,
    `Risk Level: ${lastResult.riskLevel}`,
    `Spread Distance: ${lastResult.spreadDistance}`,
  ];

  let y = y0 + 12;
  lines.forEach((line) => {
    doc.text(line, 14, y);
    y += 8;
  });

  doc.save(`greentrack-ui-prediction-${lastResult.createdAt.slice(0, 10)}.pdf`);
};



const exportToCSV = () => {
  if (!lastResult) return;

  const rows = [
    ["Field", "Value"],
    ["Created At", lastResult.createdAt],
    ["Latitude", String(lastResult.latitude)],
    ["Longitude", String(lastResult.longitude)],
    ["Temperature", String(lastResult.temperature)],
    ["Humidity", String(lastResult.humidity)],
    ["Rainfall", String(lastResult.rainfall)],
    ["Risk Level", String(lastResult.riskLevel)],
    ["Spread Distance", String(lastResult.spreadDistance)],
  ];

  const escapeCSV = (v: string) => {
    if (v.includes(",") || v.includes('"') || v.includes("\n")) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };

  const csvContent = rows
    .map((row) => row.map((cell) => escapeCSV(String(cell))).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `greentrack-ui-prediction-${lastResult.createdAt.slice(0, 10)}.csv`;
  link.click();

  window.URL.revokeObjectURL(url);
};

  const exportGreenSpacesToCSV = () => {
    if (greenSpaces.length === 0) return;

    const rows = [
      [
        "Name",
        "Health level",
        "Health %",
        "Total leaves",
        "Healthy leaves",
        "Diseased leaves",
      ],
      ...greenSpaces.map((zone) => {
        const total = zone.totalUploads ?? 0;
        const healthy = zone.healthyUploads ?? 0;
        const diseased = Math.max(total - healthy, 0);
        return [
          zone.name,
          getHealthLabel(zone),
          getHealthPercent(zone),
          String(total),
          String(healthy),
          String(diseased),
        ];
      }),
    ];

    const escapeCSV = (v: string) => {
      if (v.includes(",") || v.includes('"') || v.includes("\n")) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    const csvContent = rows
      .map((row) => row.map((cell) => escapeCSV(String(cell))).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `green-spaces-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="w-full bg-green-600 text-white shadow fixed top-0 z-50">
        <TopNavBar />
      </div>

      <div className="flex-1 overflow-auto p-6 pt-24">
        <div className="grid gap-6">
          {activeTab === "map" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Latitude</CardTitle>
                </CardHeader>
                <CardContent>{location.latitude}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Longitude</CardTitle>
                </CardHeader>
                <CardContent>{location.longitude}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Temperature</CardTitle>
                </CardHeader>
                <CardContent>{weather.temperature}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Humidity</CardTitle>
                </CardHeader>
                <CardContent>{weather.humidity}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Rainfall</CardTitle>
                </CardHeader>
                <CardContent>{weather.rainfall}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Predicted Risk of Occurence Level</CardTitle>
                </CardHeader>
                <CardContent>{spreadDetails.riskLevel}</CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Predicted Spread Distance</CardTitle>
                </CardHeader>
                <CardContent>{spreadDetails.spreadDistance}</CardContent>
              </Card>
            </div>
          ) : null}

{isLoading && (
  <Card className="border-yellow-500">
    <CardHeader>
      <CardTitle>Processing Prediction…</CardTitle>
      <CardDescription>Your request is being analyzed.</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="flex justify-center py-4">
        <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      </div>
    </CardContent>
  </Card>
)}

  {retryFn && !isLoading && activeTab === "map" && (
    <Card className="border-red-500">
      <CardHeader>
        <CardTitle>Prediction Failed</CardTitle>
        <CardDescription>You may retry the last prediction request.</CardDescription>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => retryFn()}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Retry Prediction
        </button>
      </CardContent>
    </Card>
  )}

          <Tabs
            defaultValue="map"
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "map" | "weather")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="map">Invasive Plant Risk Prediction</TabsTrigger>
              <TabsTrigger value="weather">Upload Plant Image</TabsTrigger>
              {/* <TabsTrigger value="plants">Plant Health Prediction</TabsTrigger> */}
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Map</CardTitle>
                  <CardDescription>
                    Click to view coordinates and weather-enhanced prediction
                  </CardDescription>
                  <div className="mt-3 flex gap-2">
                      <button
                        onClick={exportToCSV}
                        disabled={!lastResult}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded bg-green-600 text-white disabled:bg-gray-300"
                      >
                        <Download size={18} /> Export CSV
                      </button>

                      <button
                        onClick={exportToPDF}
                        disabled={!lastResult}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded bg-white border border-green-600 text-green-700 disabled:border-gray-300 disabled:text-gray-400"
                      >
                        <FileText size={18} /> Export PDF
                      </button>
                    </div>

                    {!lastResult && (
                      <p className="mt-2 text-sm text-gray-500">
                        Click a point on the map to generate a prediction before exporting.
                      </p>
                    )}
                </CardHeader>
                <CardContent>
                  <MapViewer 
                  setWeather={setWeather} 
                  setSpreadDetails={setSpreadDetails}
                  setLocation={setLocation}
                  setIsLoading={setIsLoading}
                  setRetryFn={setRetryFn}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="weather" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Plant Image on Map</CardTitle>
                  <CardDescription>
                    Select a hibiscus zone on the map, then upload a plant image for analysis.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {/* Reuse the same map page logic here */}
                  <div className="h-[70vh] w-full">
                    <MapClient mode="user" />
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Green spaces</CardTitle>
                      <CardDescription>
                        All active zones with health status and uploads.
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                        Healthy: {greenSpaceSummary.healthy}
                      </span>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                        Moderate: {greenSpaceSummary.moderate}
                      </span>
                      <span className="rounded-full bg-red-50 px-2 py-1 text-red-700">
                        Unhealthy: {greenSpaceSummary.unhealthy}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600">
                        No data: {greenSpaceSummary.noData}
                      </span>
                      <button
                        type="button"
                        onClick={exportGreenSpacesToCSV}
                        disabled={greenSpacesLoading || greenSpaces.length === 0}
                        className="ml-2 inline-flex items-center gap-2 rounded border border-green-600 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-50 disabled:border-gray-300 disabled:text-gray-400"
                      >
                        Export Excel
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {greenSpacesLoading ? (
                    <div className="text-sm text-gray-500">Loading green spaces…</div>
                  ) : greenSpacesError ? (
                    <div className="text-sm text-red-600">{greenSpacesError}</div>
                  ) : greenSpaces.length === 0 ? (
                    <div className="text-sm text-gray-500">No green spaces found.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                          <tr>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Health level</th>
                            <th className="px-3 py-2">Health %</th>
                            <th className="px-3 py-2">Total leaves</th>
                            <th className="px-3 py-2">Healthy leaves</th>
                            <th className="px-3 py-2">Diseased leaves</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {greenSpaces.map((zone) => {
                            const total = zone.totalUploads ?? 0;
                            const healthy = zone.healthyUploads ?? 0;
                            const diseased = Math.max(total - healthy, 0);
                            const healthLabel = getHealthLabel(zone);
                            const healthClass =
                              healthLabel === "Healthy"
                                ? "bg-emerald-50 text-emerald-700"
                                : healthLabel === "Moderate"
                                ? "bg-amber-50 text-amber-700"
                                : healthLabel === "Unhealthy"
                                ? "bg-red-50 text-red-700"
                                : "bg-slate-100 text-slate-600";

                            return (
                              <tr key={zone.id}>
                                <td className="px-3 py-3 font-medium text-gray-900">
                                  {zone.name}
                                </td>
                                <td className="px-3 py-3">
                                  <span className={`rounded-full px-2 py-1 text-xs ${healthClass}`}>
                                    {healthLabel}
                                  </span>
                                </td>
                                <td className="px-3 py-3">{getHealthPercent(zone)}</td>
                                <td className="px-3 py-3">{total}</td>
                                <td className="px-3 py-3">{healthy}</td>
                                <td className="px-3 py-3">{diseased}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
