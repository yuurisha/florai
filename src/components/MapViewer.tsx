"use client";

import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  useMapEvent,
  useMap
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat";

// Extend Leaflet to include heatLayer typing
declare module "leaflet" {
  export function heatLayer(
    latlngs: [number, number, number][],
    options?: {
      minOpacity?: number;
      maxZoom?: number;
      max?: number;
      radius?: number;
      blur?: number;
      gradient?: { [key: number]: string };
    }
  ): any;
}

// Props interface for the component
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
}

// Click handler to trigger on map click
const ClickHandler = ({ onMapClick }: { onMapClick: (e: any) => void }) => {
  useMapEvent("click", onMapClick);
  return null;
};

// Heatmap rendering logic
const HeatmapLayer = ({ points }: { points: [number, number, number][] }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;

    const heatLayer = L.heatLayer(points, {
      radius: 30,
      blur: 20,
      maxZoom: 17,
      minOpacity: 0.4,
      gradient: {
        0.2: "green",
        0.5: "orange",
        0.8: "red",
      },
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [points, map]);

  return null;
};

// Main MapViewer component with props
const MapViewer = ({ setWeather, setSpreadDetails }: MapViewerProps) => {
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>([]);

  const apiKey = "2bf9dfdb74441da8e8cc8fb887d2ceec"; // Your OpenWeather API Key

  // Handles click events to fetch weather + model prediction and update state
  const handleMapClick = async (e: any) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;
    const delta = 0.002;
    const newPoints: [number, number, number][] = [];

    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );
      const weatherData = await weatherRes.json();

      const temperature = weatherData.main.temp;
      const humidity = weatherData.main.humidity;
      const rainfall = weatherData.rain?.["1h"] || 0;

      // Update parent component's weather card
      setWeather({
        temperature: `${temperature} °C`,
        humidity: `${humidity} %`,
        rainfall: `${rainfall} mm`,
      });

      for (let i = -2; i <= 2; i++) {
        for (let j = -2; j <= 2; j++) {
          const gridLat = lat + i * delta;
          const gridLon = lon + j * delta;

          const res = await fetch("/api/predictAll", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: gridLat,
              longitude: gridLon,
              temperature,
              rainfall,
              humidity,
            }),
          });

          const { risk_level, spread_distance_km } = await res.json();

          // Update parent card for clicked point only
          if (i === 0 && j === 0) {
            setSpreadDetails({
              riskLevel: risk_level,
              spreadDistance: `${spread_distance_km} km`,
            });
          }

          let intensity = 0.2;
          if (risk_level === "Medium") intensity = 0.5;
          if (risk_level === "High") intensity = 0.8;

          intensity = Math.min(1, intensity + spread_distance_km / 10);

          newPoints.push([gridLat, gridLon, intensity]);
        }
      }

      setHeatPoints(newPoints);
    } catch (error) {
      console.error("Prediction heatmap failed:", error);
    }
  };

  return (
    <MapContainer
      center={[3.15, 101.7]}
      zoom={14}
      style={{ height: "600px", width: "100%" }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <ClickHandler onMapClick={handleMapClick} />
      <HeatmapLayer points={heatPoints} />
    </MapContainer>
  );
};

export default MapViewer;
