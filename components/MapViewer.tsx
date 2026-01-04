"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvent,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";
import { auth } from "@/lib/firebaseConfig";
import toast from "react-hot-toast";

declare module "leaflet" {
  export function heatLayer(
    latlngs: [number, number, number][],
    options?: any
  ): any;
}

interface MapViewerProps {
  setWeather: React.Dispatch<
    React.SetStateAction<{
      temperature: string;
      humidity: string;
      rainfall: string;
    }>
  >;
  setSpreadDetails: React.Dispatch<
    React.SetStateAction<{
      riskLevel: string;
      spreadDistance: string;
    }>
  >;
  setLocation: React.Dispatch<
    React.SetStateAction<{
      latitude: string;
      longitude: string;
    }>
  >;
  setIsLoading: (value: boolean) => void;
  setRetryFn: (fn: null | (() => void)) => void;
}

const ClickHandler = ({ onMapClick }: { onMapClick: (e: any) => void }) => {
  useMapEvent("click", onMapClick);
  return null;
};

const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: {
      0.0: "green",
      0.33: "green",
      0.34: "orange",
      0.66: "orange",
      0.67: "red",
      1.0: "red",
    },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;
};

// Convert decimal degrees → DMS
function toDMS(dec: number): string {
  const deg = Math.floor(dec);
  const minFloat = (dec - deg) * 60;
  const min = Math.floor(minFloat);
  const sec = ((minFloat - min) * 60).toFixed(2);

  return `${deg}° ${min}' ${sec}"`;
}

const MapViewer = ({
  setWeather,
  setSpreadDetails,
  setLocation,
  setIsLoading,
  setRetryFn,
}: MapViewerProps) => {
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>([]);
  const clickLocked = useRef(false);

  const apiKey = "2bf9dfdb74441da8e8cc8fb887d2ceec";

  // Debounce clicks to prevent spamming predictions
  function debounceClick(callback: () => void, delay = 800) {
    if (clickLocked.current) return;
    clickLocked.current = true;

    callback();

    setTimeout(() => {
      clickLocked.current = false;
    }, delay);
  }

  const handleMapClick = async (e: any) => {
    debounceClick(async () => {

      setRetryFn(null);         // Clear retry
      setIsLoading(true);       // Start loading animation

      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      // Update lat/lon cards immediately in DMS
      setLocation({
        latitude: toDMS(lat),
        longitude: toDMS(lon),
      });

      const delta = 0.002;
      const newPoints: [number, number, number][] = [];

      // Reset prediction cards
      setSpreadDetails({
        riskLevel: "--",
        spreadDistance: "--",
      });

      try {
        // ---------------------------------------------
        // WEATHER FETCH
        // ---------------------------------------------
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
        );

        if (!weatherRes.ok) throw new Error("Weather API error");

        const weatherData = await weatherRes.json();

        const temperature = weatherData.main.temp;
        const humidity = weatherData.main.humidity;
        const rainfall = weatherData.rain?.["1h"] || 0;

        setWeather({
          temperature: `${temperature} °C`,
          humidity: `${humidity} %`,
          rainfall: `${rainfall} mm`,
        });

        const userID = auth.currentUser?.uid ?? null;

        // ---------------------------------------------
        // 25-GRID PREDICTION LOOP
        // ---------------------------------------------
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            const gridLat = lat + i * delta;
            const gridLon = lon + j * delta;
            const isCenter = i === 0 && j === 0;

            const source = isCenter ? "user_clicked_point" : "user_click_remaining_grid";

            const res = await fetch("/api/predictAll", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userID: isCenter ? userID : null,
                source: isCenter ? "user_clicked_point" : "user_click_remaining_grid",
                save: isCenter,          // ✅ only center stored
                createAlert: isCenter,   // ✅ only center alerts
                latitude: gridLat,
                longitude: gridLon,
                temperature,
                rainfall,
                humidity,
              }),
            });

            if (!res.ok) throw new Error("Prediction failed");

            const data = await res.json();
            const { risk_level, spread_distance_km } = data;

            if (isCenter) {
              setSpreadDetails({
                riskLevel: risk_level,
                spreadDistance: `${spread_distance_km} km`,
              });
            }

            function riskToIntensity(risk: string) {
              if (risk === "High") return 0.85;
              if (risk === "Medium") return 0.55;
              return 0.25; // Low (default)
            }

            // Heatmap intensity
            let intensity = riskToIntensity(risk_level);

            newPoints.push([gridLat, gridLon, intensity]);
          }
        }

        // SUCCESS → Update heatmap
        setHeatPoints(newPoints);
        setIsLoading(false);

        toast.success("Prediction completed!");

      } catch (err) {
        console.error(err);

        toast.error("Prediction failed. Tap retry.");

        setIsLoading(false);
        setHeatPoints([]);

        // Provide retry callback
        setRetryFn(() => () => handleMapClick(e));
      }
    });
  };

  return (
    <MapContainer
      center={[3.15, 101.7]}
      zoom={14}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={handleMapClick} />
      <HeatmapLayer points={heatPoints} />
    </MapContainer>
  );
};

export default MapViewer;
