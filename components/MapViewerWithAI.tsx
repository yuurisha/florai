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
  setWeather: React.Dispatch<React.SetStateAction<{
    temperature: string;
    humidity: string;
    rainfall: string;
  }>>;
  setSpreadDetails: React.Dispatch<React.SetStateAction<{
    riskLevel: string;
    spreadDistance: string;
  }>>;
  setLocation: React.Dispatch<React.SetStateAction<{
    latitude: string;
    longitude: string;
  }>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setRetryFn: React.Dispatch<React.SetStateAction<null | (() => void)>>;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
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
      max: 1.0,
      gradient: {
        0.0: "green",
        0.4: "yellow",
        0.6: "orange",
        0.8: "red",
        1.0: "darkred",
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

export default function MapViewerWithAI({
  setWeather,
  setSpreadDetails,
  setLocation,
  setIsLoading,
  setRetryFn,
  setError
}: MapViewerProps) {
  const [heatPoints, setHeatPoints] = useState<[number, number, number][]>([]);
  const clickLocked = useRef(false);

  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || "";
  const AI_MODEL_API = "/api/ai-predict"; // Use Next.js proxy instead of localhost

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

      setRetryFn(null);
      setIsLoading(true);

      const lat = e.latlng.lat;
      const lon = e.latlng.lng;

      // Get current user ID
      const userID = auth.currentUser?.uid ?? null;

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
        // WEATHER FETCH from OpenWeather
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

        // ---------------------------------------------
        // AI MODEL PREDICTION for center point
        // ---------------------------------------------
        
        // Prepare weather data for AI model
        const weatherForAI = {
          latitude: lat,
          longitude: lon,
          temperatureMax: temperature + 2, // Estimate max temp
          temperatureMin: temperature - 2, // Estimate min temp
          precipitation: rainfall,
          windSpeed: weatherData.wind?.speed ? weatherData.wind.speed * 3.6 : 10, // Convert m/s to km/h
          sunshineDuration: weatherData.clouds?.all ? (100 - weatherData.clouds.all) * 432 : 36000, // Estimate from cloud cover
          rainHours: rainfall > 0 ? 1 : 0,
          userId: userID, // Include user ID for notifications
          createNotification: true, // Create notification for center point
          savePrediction: true // Save prediction to database
        };

        // Call AI Model API via Next.js proxy
        const aiResponse = await fetch(AI_MODEL_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(weatherForAI),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          throw new Error(`AI Model prediction failed (${aiResponse.status}): ${errorText}`);
        }

        const aiData = await aiResponse.json();

        // Update spread details with AI prediction
        setSpreadDetails({
          riskLevel: aiData.likelihood, // "Low", "Medium", or "High"
          spreadDistance: `${(aiData.confidence * 10).toFixed(1)} km`, // Use confidence as spread estimate
        });

        // Add center point to heatmap
        const centerIntensity = aiData.likelihood === "High" ? 0.9 : 
                               aiData.likelihood === "Medium" ? 0.5 : 0.2;
        newPoints.push([lat, lon, centerIntensity]);

        // ---------------------------------------------
        // 25-GRID PREDICTION LOOP using AI Model
        // ---------------------------------------------
        for (let i = -2; i <= 2; i++) {
          for (let j = -2; j <= 2; j++) {
            // Skip center point (already processed)
            if (i === 0 && j === 0) continue;

            const gridLat = lat + i * delta;
            const gridLon = lon + j * delta;

            // Fetch weather for grid point
            const gridWeatherRes = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${gridLat}&lon=${gridLon}&appid=${apiKey}&units=metric`
            );

            if (!gridWeatherRes.ok) continue; // Skip this grid point if weather fetch fails

            const gridWeatherData = await gridWeatherRes.json();
            const gridTemp = gridWeatherData.main.temp;
            const gridRainfall = gridWeatherData.rain?.["1h"] || 0;

            // Prepare data for AI prediction
            const gridWeatherForAI = {
              latitude: gridLat,
              longitude: gridLon,
              temperatureMax: gridTemp + 2,
              temperatureMin: gridTemp - 2,
              precipitation: gridRainfall,
              windSpeed: gridWeatherData.wind?.speed ? gridWeatherData.wind.speed * 3.6 : 10,
              sunshineDuration: gridWeatherData.clouds?.all ? (100 - gridWeatherData.clouds.all) * 432 : 36000,
              rainHours: gridRainfall > 0 ? 1 : 0,
              userId: null, // No user ID for grid points
              createNotification: false, // No notification for grid points
              savePrediction: false // Don't save grid predictions
            };

            // Call AI Model for grid point via Next.js proxy
            const gridAiResponse = await fetch(AI_MODEL_API, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(gridWeatherForAI),
            });

            if (!gridAiResponse.ok) {
              console.warn(`Grid prediction failed at (${gridLat}, ${gridLon}): ${gridAiResponse.status}`);
              continue;
            }

            const gridAiData = await gridAiResponse.json();

            // Convert likelihood to intensity
            const intensity = gridAiData.likelihood === "High" ? 0.9 :
                            gridAiData.likelihood === "Medium" ? 0.5 : 0.2;

            newPoints.push([gridLat, gridLon, intensity]);
          }
        }

        // SUCCESS → Update heatmap
        setHeatPoints(newPoints);
        setIsLoading(false);

        toast.success(`AI Prediction: ${aiData.likelihood} risk (${(aiData.confidence * 100).toFixed(1)}% confidence)`);

      } catch (err: any) {
        console.error("Detailed prediction error:", err);

        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        toast.error(errorMessage || "Prediction failed. Tap retry.");

        setIsLoading(false);
        setHeatPoints([]);
        setError(errorMessage);

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
}
