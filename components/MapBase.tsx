"use client";

import { useEffect, useMemo, useState, ChangeEvent } from "react";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import { getAuth } from "firebase/auth";
import { updateDailyStreak } from "@/controller/userStatsController";
import { GreenSpace } from "@/models/greenSpace";
import {
  createGreenSpace,
  fetchGreenSpaces,
  deleteGreenSpace,
} from "@/controller/greenSpaceController";
import { uploadLeafPhotoAndPredict } from "@/controller/uploadController";

type Mode = "user" | "admin";

type HibiscusZone = GreenSpace & {
  weeklyUploads?: number;
};

export default function MapBase({ mode }: { mode: Mode }) {
  const [mapReady, setMapReady] = useState(false);
  const [zones, setZones] = useState<HibiscusZone[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentZoneName, setCurrentZoneName] = useState("");
  const [currentZoneId, setCurrentZoneId] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const nextName = useMemo(
    () => () => `Hibiscus Zone (${new Date().toLocaleDateString()})`,
    []
  );

  /* ================= MODAL ================= */
  const resetModal = () => {
    setIsModalOpen(false);
    setCurrentZoneId("");
    setCurrentZoneName("");
    setImageFile(null);

    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    setLoading(false);
  };

  const openModal = (id: string, name: string) => {
    setCurrentZoneId(id);
    setCurrentZoneName(name);
    setIsModalOpen(true);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });

    setImageFile(file);
  };

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  /* ================= UPLOAD + AI ================= */
  const handleUploadAndPredict = async () => {
    if (!imageFile || !currentZoneId) return;

    setLoading(true);
    try {
      const result = await uploadLeafPhotoAndPredict(imageFile, currentZoneId);

      const user = getAuth().currentUser;
      if (user) await updateDailyStreak(user.uid);

      alert(
        `Prediction Result:\n${result.status}\n${result.predictedClass} (${(
          result.confidence * 100
        ).toFixed(1)}%)`
      );

      resetModal();

      const updated = await fetchGreenSpaces();
      setZones(updated);
    } catch (err) {
      console.error(err);
      alert("Upload or prediction failed.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= MAP INIT ================= */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet-draw");

      if (cancelled) return;

      const container = document.getElementById("map") as any;
      if (!container || container.dataset.initialized) return;
      container.dataset.initialized = "true";

      const map = L.map("map").setView([3.1208, 101.6544], 15);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      /* ================= STEP 7: LEGEND ================= */
const legend = (L as any).control({ position: "topright" });

      legend.onAdd = () => {
        const div = L.DomUtil.create("div");
        div.style.background = "white";
        div.style.padding = "10px 12px";
        div.style.borderRadius = "10px";
        div.style.boxShadow = "0 2px 12px rgba(0,0,0,0.15)";
        div.style.fontSize = "12px";
        div.style.lineHeight = "1.4";
        div.style.minWidth = "140px";

        const row = (color: string, label: string) => `
          <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="width:12px;height:12px;background:${color};display:inline-block;border-radius:3px;border:1px solid rgba(0,0,0,0.15)"></span>
            <span>${label}</span>
          </div>
        `;

        div.innerHTML = `
          <div style="font-weight:700;margin-bottom:4px;">Plant Health</div>
          ${row("#2ECC71", "Healthy")}
          ${row("#F1C40F", "Moderate")}
          ${row("#E74C3C", "Sick")}
          ${row("#95A5A6", "No data")}
          <div style="margin-top:8px;color:#6b7280;">
            Based on zone health index
          </div>
        `;
        return div;
      };

      legend.addTo(map);

      const legendEl = (legend as any).getContainer?.();
      if (legendEl) {
        L.DomEvent.disableClickPropagation(legendEl);
        L.DomEvent.disableScrollPropagation(legendEl);
      }

      const drawnItems = new L.FeatureGroup();
      map.addLayer(drawnItems);

      /* ===== ADMIN DRAW ===== */
      if (mode === "admin") {
        const drawControl = new (L as any).Control.Draw({
          edit: { featureGroup: drawnItems },
          draw: {
            polygon: true,
            rectangle: false,
            circle: false,
            circlemarker: false,
            marker: false,
            polyline: false,
          },
        });

        map.addControl(drawControl);

        map.on((L as any).Draw.Event.CREATED, async (e: any) => {
          const points = e.layer
            .getLatLngs()[0]
            .map((p: any) => ({ lat: p.lat, lng: p.lng }));

          await createGreenSpace(nextName(), points);
          setZones(await fetchGreenSpaces());
          alert("Green space added.");
        });
      }

      container.__leaflet_map__ = map;
      container.__leaflet_L__ = L;
      container.__legend__ = legend;

      setMapReady(true);
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      const container = document.getElementById("map") as any;

      if (container?.__legend__) {
        try {
          container.__legend__.remove();
        } catch {}
        delete container.__legend__;
      }

      if (container?.__leaflet_map__) container.__leaflet_map__.remove();
      if (container) {
        delete container.dataset.initialized;
        delete container.__leaflet_map__;
        delete container.__leaflet_L__;
        delete container.__zones_layer__;
      }
      setMapReady(false);
    };
  }, [mode, nextName]);

  /* ================= LOAD ZONES ================= */
  useEffect(() => {
    if (!mapReady) return;
    fetchGreenSpaces().then(setZones);
  }, [mapReady]);

  /* ================= RENDER ZONES ================= */
  useEffect(() => {
    if (!mapReady) return;

    const container = document.getElementById("map") as any;
    const map = container.__leaflet_map__;
    const L = container.__leaflet_L__;
    if (!map || !L) return;

    if (container.__zones_layer__) map.removeLayer(container.__zones_layer__);
    const group = L.layerGroup();

    /* ===== STEP 6: COLOR LOGIC ===== */
    const getZoneColor = (z: HibiscusZone) => {
      const total = z.totalUploads ?? 0;
      if (total === 0) return "#95A5A6";
      if ((z.healthIndex ?? 0) >= 0.8) return "#2ECC71";
      if ((z.healthIndex ?? 0) >= 0.6) return "#F1C40F";
      return "#E74C3C";
    };

    const createZoneMarker = (z: HibiscusZone, poly: any) => {
      const center = poly.getBounds().getCenter();

      const marker = L.marker(center, {
        icon: L.divIcon({
          className: "",
          html: `
            <div style="
              background:#16a34a;
              width:18px;
              height:18px;
              border-radius:50%;
              border:2px solid white;
              box-shadow:0 2px 6px rgba(0,0,0,0.3);
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        }),
      });

      return marker;
    };

    zones.forEach((z) => {
      const poly = L.polygon(
        z.polygon.map((p) => [p.lat, p.lng]),
        {
          fillColor: getZoneColor(z),
          fillOpacity: 0.55,
          color: "#2c3e50",
          weight: 2,
        }
      );

      poly.on("click", () => {
        const total = z.totalUploads ?? 0;
        const healthText =
          total === 0 ? "No data yet" : (z.healthIndex ?? 0).toFixed(2);

        const div = L.DomUtil.create("div");
        div.innerHTML = `
          <b>${z.name}</b><br/>
          Health Index: ${healthText}<br/>
          Total Uploads: ${total}
        `;

        const uploadBtn = L.DomUtil.create("button", "", div);
        uploadBtn.textContent = "Upload Photo";
        uploadBtn.style.marginTop = "8px";
        uploadBtn.style.padding = "6px 12px";
        uploadBtn.style.background = "#4CAF50";
        uploadBtn.style.color = "white";
        uploadBtn.style.border = "none";
        uploadBtn.style.borderRadius = "6px";
        uploadBtn.onclick = () => {
          map.closePopup();
          openModal(z.id, z.name);
        };

        if (mode === "admin") {
          const delBtn = L.DomUtil.create("button", "", div);
          delBtn.textContent = "Remove";
          delBtn.style.marginLeft = "6px";
          delBtn.onclick = async () => {
            if (!confirm(`Remove "${z.name}"?`)) return;
            await deleteGreenSpace(z.id);
            setZones(await fetchGreenSpaces());
          };
        }

        poly.bindPopup(div).openPopup();
      });

      poly.addTo(group);
      // ===== ADD CENTER MARKER =====
      const marker = createZoneMarker(z, poly);

      // same click behavior as polygon
      marker.on("click", () => {
        poly.fire("click");
      });

      marker.addTo(group);

    });

    group.addTo(map);
    container.__zones_layer__ = group;
  }, [zones, mode, mapReady]);

  /* ================= UI ================= */
  return (
    <>
      <div id="map" style={{ height: "100vh", width: "100vw" }} />

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-xl w-96 space-y-4">
            <h2 className="font-bold text-lg">{currentZoneName}</h2>

            <label className="block border-2 border-dashed p-4 text-center cursor-pointer">
              {imagePreview ? (
                <img src={imagePreview} className="mx-auto max-h-40" />
              ) : (
                "Click to upload image"
              )}
              <input type="file" accept="image/*" hidden onChange={handleFileChange} />
            </label>

            <div className="flex justify-between">
              <button onClick={resetModal}>Cancel</button>
              <button
                onClick={handleUploadAndPredict}
                disabled={loading || !imageFile}
              >
                {loading ? "Uploading..." : "Upload & Analyze"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
