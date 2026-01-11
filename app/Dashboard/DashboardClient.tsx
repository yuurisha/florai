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
import jsPDF from "jspdf";
import toast from "react-hot-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/card";
import { Input } from "../../components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/tabs";

import MapViewer from "../../components/MapViewer";
import TopNavBar from "../../components/TopNavBar";
import router from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../lib/firebaseConfig";

export default function DashboardClient() {
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        try {
          // User is not signed in, redirect to login
          window.location.href = "/login";
        } catch (error: any) {
          console.error("Redirect to login failed:", error);
          toast.error("Failed to redirect to login. Please refresh the page.");
        }
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      toast.error("Authentication error. Please refresh the page.");
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
  const [error, setError] = useState<string | null>(null);

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

const exportToPDF = () => {
  if (!lastResult) {
    toast.error("No prediction data available to export.");
    return;
  }

  try {
    const doc = new jsPDF();
    const title = "Prediction Report";
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
    toast.success("PDF exported successfully!");
  } catch (error: any) {
    console.error("PDF export failed:", error);
    toast.error(error?.message || "Failed to export PDF. Please try again.");
  }
};


const exportToCSV = () => {
  if (!lastResult) {
    toast.error("No prediction data available to export.");
    return;
  }

  try {
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
    link.download = `FlorAIprediction-${lastResult.createdAt.slice(0, 10)}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  } catch (error: any) {
    console.error("CSV export failed:", error);
    toast.error(error?.message || "Failed to export CSV. Please try again.");
  }
};

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <div className="w-full bg-green-600 text-white shadow fixed top-0 z-50">
        <TopNavBar />
      </div>

      <div className="flex-1 overflow-auto p-6 pt-24">
        <div className="grid gap-6">
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

  {retryFn && !isLoading && (
    <Card className="border-red-500 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-700">Prediction Failed</CardTitle>
        <CardDescription className="text-red-600">
          {error || "An error occurred while processing your prediction."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <button
          onClick={() => {
            setError(null);
            retryFn();
          }}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          Retry Prediction
        </button>
      </CardContent>
    </Card>
  )}

          <Tabs defaultValue="map">
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
                  setError={setError}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
