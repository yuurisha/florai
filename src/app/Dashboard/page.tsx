"use client";

import { useState, useEffect } from "react";
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


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/card";
import { Input } from "@/components/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";

import MapViewer from "@/components/MapViewer";
import TopNavBar from "@/components/TopNavBar";
import router from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebaseConfig";

export default function DashboardPage() {
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

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const exportToPDF = () => {
    const link = document.createElement("a");
    link.href = "data:application/pdf;base64,...";
    link.download = "greentrack-dashboard.pdf";
    link.click();
  };

  const exportToCSV = () => {
    const csvData = [
      ["Metric", "Value"],
      ["Temperature", weather.temperature],
      ["Humidity", weather.humidity],
      ["Rainfall", weather.rainfall],
      ["Risk Level", spreadDetails.riskLevel],
      ["Spread Distance", spreadDetails.spreadDistance],
    ];
    const csvContent = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "greentrack-data.csv";
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <CardTitle>Risk Level</CardTitle>
              </CardHeader>
              <CardContent>{spreadDetails.riskLevel}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Spread Distance</CardTitle>
              </CardHeader>
              <CardContent>{spreadDetails.spreadDistance}</CardContent>
            </Card>
          </div>

          <Tabs defaultValue="map">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="map">Invasive Plant Risk Prediction</TabsTrigger>
              <TabsTrigger value="weather">Upload Plant Image</TabsTrigger>
              <TabsTrigger value="plants">Plant Health Prediction</TabsTrigger>
            </TabsList>

            <TabsContent value="map" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Interactive Map</CardTitle>
                  <CardDescription>
                    Click to view coordinates and weather-enhanced prediction
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <MapViewer setWeather={setWeather} setSpreadDetails={setSpreadDetails} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
