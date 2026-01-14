"use client";

import { useEffect, useState } from "react";
import MapClient from "@/components/MapClient";
import AdminTopNavBar from "@/components/adminTopNavBar";
import { GreenSpace } from "@/models/greenSpace";
import toast from "react-hot-toast";
import {
  deleteGreenSpace,
  removeGreenSpacePhoto,
  updateGreenSpaceMeta,
  uploadGreenSpacePhoto,
} from "@/controller/greenSpaceController";
import { fetchGreenSpaces } from "@/controller/greenSpaceController";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

type DrawAction = "draw" | "edit" | "delete";

const triggerDrawAction = (action: DrawAction) => {
  const selector =
    action === "draw"
      ? ".leaflet-draw-draw-polygon"
      : action === "edit"
      ? ".leaflet-draw-edit-edit"
      : ".leaflet-draw-edit-remove";

  const btn = document.querySelector(selector) as HTMLButtonElement | HTMLAnchorElement | null;
  btn?.click();
};

export default function Page() {
  const [drawReady, setDrawReady] = useState(false);
  const [selectedZone, setSelectedZone] = useState<GreenSpace | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [zoneName, setZoneName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const [pendingPhotoUrl, setPendingPhotoUrl] = useState<string | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);
  const [tableRows, setTableRows] = useState<
    { zone: GreenSpace; latestUpload: string | null }[]
  >([]);
  const [healthWindowDays, setHealthWindowDays] = useState<5 | 30>(30);

  const getRollingWindowLabel = (days: number) => `Last ${days} days`;

  const getWindowStats = (zone: GreenSpace) => {
    if (healthWindowDays === 5) {
      return {
        total: zone.totalUploads5 ?? 0,
        healthy: zone.healthyUploads5 ?? 0,
        healthIndex: zone.healthIndex5 ?? null,
      };
    }
    return {
      total: zone.totalUploads ?? 0,
      healthy: zone.healthyUploads ?? 0,
      healthIndex: zone.healthIndex ?? null,
    };
  };

  const getHealthLabel = (zone: GreenSpace) => {
    const { total, healthIndex } = getWindowStats(zone);
    if (total === 0) return "No data";
    if (total < 5 || healthIndex === null) return "Pending / Insufficient data";
    if (healthIndex >= 0.8) return "Healthy";
    if (healthIndex >= 0.6) return "Moderate";
    return "Unhealthy";
  };

  const getHealthPercent = (zone: GreenSpace) => {
    const { total, healthIndex } = getWindowStats(zone);
    if (total === 0) return "--";
    if (total < 5) return "--";
    if (healthIndex === null) return "--";
    return `${Math.round(healthIndex * 100)}%`;
  };

  const formatUploadDate = (value: any) => {
    try {
      if (value && typeof value.toDate === "function") {
        return value.toDate().toLocaleString();
      }
      if (typeof value === "number") {
        return new Date(value).toLocaleString();
      }
    } catch {}
    return "—";
  };

  const refreshTable = async () => {
    setTableLoading(true);
    setTableError(null);
    try {
      const zones = await fetchGreenSpaces();
      const zoneIds = new Set(zones.map((zone) => zone.id));
      const latestUploads = new Map<string, any>();

      const uploadsRef = collection(db, "uploads");
      const uploadsSnap = await getDocs(
        query(uploadsRef, orderBy("createdAt", "desc"), limit(500))
      );

      uploadsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const greenSpaceId = data?.greenSpaceId as string | undefined;
        if (!greenSpaceId || !zoneIds.has(greenSpaceId)) return;
        if (latestUploads.has(greenSpaceId)) return;
        latestUploads.set(greenSpaceId, data?.createdAt ?? null);
      });

      const rows = zones.map((zone) => ({
        zone,
        latestUpload: latestUploads.get(zone.id) ?? null,
      }));

      setTableRows(rows);
    } catch (err: any) {
      console.error(err);
      setTableError("Failed to load table data.");
    } finally {
      setTableLoading(false);
    }
  };

  const exportTableToCSV = () => {
    if (tableRows.length === 0) return;

    const rollingWindowLabel = getRollingWindowLabel(healthWindowDays);
    const rows = [
      [
        "Name",
        `Health level (${rollingWindowLabel})`,
        "Health %",
        `Observations (${rollingWindowLabel})`,
        "Healthy leaves",
        "Diseased leaves",
        "Latest photo upload",
      ],
      ...tableRows.map(({ zone, latestUpload }) => {
        const { total, healthy } = getWindowStats(zone);
        const diseased = Math.max(total - healthy, 0);
        return [
          zone.name,
          getHealthLabel(zone),
          getHealthPercent(zone),
          String(total),
          String(healthy),
          String(diseased),
          latestUpload ? formatUploadDate(latestUpload) : "—",
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
    link.download = `green-spaces-admin-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setZoneName(selectedZone?.name ?? "");
    if (pendingPhotoUrl) URL.revokeObjectURL(pendingPhotoUrl);
    setPendingPhotoUrl(null);
    setPendingPhotoFile(null);
  }, [selectedZone]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 50);
    return () => window.clearTimeout(timer);
  }, [sidebarOpen]);

  useEffect(() => {
    if (!showTable) return;
    refreshTable();
  }, [showTable, refreshKey]);

  useEffect(() => {
    let cancelled = false;
    const interval = window.setInterval(() => {
      const hasDraw = document.querySelector(".leaflet-draw-draw-polygon");
      if (hasDraw && !cancelled) {
        setDrawReady(true);
        window.clearInterval(interval);
      }
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const handleSaveName = async () => {
    if (!selectedZone) return;
    const trimmed = zoneName.trim();
    if (!trimmed || trimmed === selectedZone.name) return;
    setSavingName(true);
    try {
      await updateGreenSpaceMeta(selectedZone.id, { name: trimmed });
      setSelectedZone({ ...selectedZone, name: trimmed });
      setRefreshKey((v) => v + 1);
      toast.success("Zone name updated.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to update zone name.");
    } finally {
      setSavingName(false);
    }
  };

  const handlePhotoChange = async (file: File) => {
    try {
      const allowedTypes = ["image/jpeg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG or PNG files are allowed.");
        return;
      }
      if (pendingPhotoUrl) URL.revokeObjectURL(pendingPhotoUrl);
      const previewUrl = URL.createObjectURL(file);
      setPendingPhotoFile(file);
      setPendingPhotoUrl(previewUrl);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to preview photo. Please try another file.");
    }
  };

  const handleSavePhoto = async () => {
    if (!selectedZone || !pendingPhotoFile) return;
    setPhotoBusy(true);
    try {
      const url = await uploadGreenSpacePhoto(selectedZone.id, pendingPhotoFile);
      setSelectedZone({ ...selectedZone, photoUrl: url });
      setRefreshKey((v) => v + 1);
      toast.success("Photo uploaded.");
      if (pendingPhotoUrl) URL.revokeObjectURL(pendingPhotoUrl);
      setPendingPhotoUrl(null);
      setPendingPhotoFile(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Photo upload failed.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!selectedZone) return;
    if (pendingPhotoUrl && !selectedZone.photoUrl) {
      URL.revokeObjectURL(pendingPhotoUrl);
      setPendingPhotoUrl(null);
      setPendingPhotoFile(null);
      toast.success("Photo cleared.");
      return;
    }
    if (!selectedZone.photoUrl) return;
    setPhotoBusy(true);
    try {
      await removeGreenSpacePhoto(selectedZone.id);
      setSelectedZone({ ...selectedZone, photoUrl: null });
      setRefreshKey((v) => v + 1);
      if (pendingPhotoUrl) URL.revokeObjectURL(pendingPhotoUrl);
      setPendingPhotoUrl(null);
      setPendingPhotoFile(null);
      toast.success("Photo removed.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to remove photo.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;
    const ok = window.confirm(`Delete "${selectedZone.name}"? This cannot be undone.`);
    if (!ok) return;
    try {
      await deleteGreenSpace(selectedZone.id);
      setSelectedZone(null);
      setRefreshKey((v) => v + 1);
      toast.success("Green space deleted.");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message ?? "Failed to delete green space.");
    }
  };

  return (
    <>
      <div className="relative z-50">
        <AdminTopNavBar />
      </div>
      <div className="relative z-0 flex h-[calc(100vh-4rem)] flex-col bg-slate-50 xl:flex-row">
        <div className="relative flex-1 p-4 space-y-4">
          <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-4 py-2 text-xs">
                <span className="font-semibold text-slate-600">Health window</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setHealthWindowDays(30)}
                    className={`rounded-full border px-3 py-1 font-semibold ${
                      healthWindowDays === 30
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    30 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setHealthWindowDays(5)}
                    className={`rounded-full border px-3 py-1 font-semibold ${
                      healthWindowDays === 5
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    5 days
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <MapClient
                  mode="admin"
                  onZoneSelect={(zone) => setSelectedZone(zone)}
                  refreshKey={refreshKey}
                  mapId="admin-map"
                  healthWindowDays={healthWindowDays}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-900">
                  Green Space Table
                </h3>
                <p className="text-xs text-slate-600">
                  Health summary with latest photo upload time.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowTable((v) => !v)}
                  className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {showTable ? "Hide Table" : "Show Table"}
                </button>
                <button
                  type="button"
                  onClick={refreshTable}
                  disabled={!showTable || tableLoading}
                  className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={exportTableToCSV}
                  disabled={!showTable || tableLoading || tableRows.length === 0}
                  className="inline-flex items-center gap-2 rounded border border-green-600 px-3 py-2 font-semibold text-green-700 hover:bg-green-50 disabled:border-slate-200 disabled:text-slate-400"
                >
                  Export Excel
                </button>
              </div>
            </div>

            {showTable ? (
              <div className="mt-4">
                {tableLoading ? (
                  <div className="text-sm text-slate-600">Loading table…</div>
                ) : tableError ? (
                  <div className="text-sm text-red-600">{tableError}</div>
                ) : tableRows.length === 0 ? (
                  <div className="text-sm text-slate-600">No green spaces found.</div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full text-sm">
                      <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">
                          Health level ({getRollingWindowLabel(healthWindowDays)})
                        </th>
                        <th className="px-3 py-2">Health %</th>
                        <th className="px-3 py-2">
                          Observations ({getRollingWindowLabel(healthWindowDays)})
                        </th>
                          <th className="px-3 py-2">Healthy leaves</th>
                          <th className="px-3 py-2">Diseased leaves</th>
                          <th className="px-3 py-2">Latest photo upload</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tableRows.map(({ zone, latestUpload }) => {
                          const { total, healthy } = getWindowStats(zone);
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
                            <tr key={zone.id} className="bg-white">
                              <td className="px-3 py-3 font-medium text-slate-900">
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
                              <td className="px-3 py-3">
                                {latestUpload ? formatUploadDate(latestUpload) : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="absolute right-2 top-1/2 z-[1000] hidden h-12 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 xl:flex"
            aria-label={sidebarOpen ? "Hide panel" : "Show panel"}
          >
            {sidebarOpen ? "›" : "‹"}
          </button>
        </div>

        <aside
          className={`w-full overflow-hidden border-t border-slate-200 bg-white xl:border-l xl:border-t-0 xl:transition-[width,opacity,padding] xl:duration-300 xl:ease-out ${
            sidebarOpen ? "xl:w-80 xl:p-4 xl:opacity-100" : "xl:w-0 xl:p-0 xl:opacity-0"
          }`}
          aria-hidden={!sidebarOpen}
        >
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Manage Map
              </p>
              <h2 className="text-lg font-semibold text-slate-900">Green Space Tools</h2>
              <p className="mt-1 text-sm text-slate-600">
                Use the draw controls on the map to add, edit, or remove green space polygons.
              </p>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => triggerDrawAction("draw")}
                disabled={!drawReady}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Draw green space polygon
              </button>
             
            </div>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selected Green Space
              </p>
              {selectedZone ? (
                <div className="mt-3 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
                      {pendingPhotoUrl || selectedZone.photoUrl ? (
                        <img
                          src={pendingPhotoUrl ?? selectedZone.photoUrl ?? undefined}
                          alt={selectedZone.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
                          No photo
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {selectedZone.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        Uploads ({getRollingWindowLabel(healthWindowDays)}):{" "}
                        {getWindowStats(selectedZone).total}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Zone name</label>
                    <div className="flex gap-2">
                      <input
                        value={zoneName}
                        onChange={(e) => setZoneName(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-emerald-200"
                        placeholder="Hibiscus Zone"
                      />
                      <button
                        type="button"
                        onClick={handleSaveName}
                        disabled={savingName || zoneName.trim().length === 0}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600">Display photo</label>
                    <div className="flex flex-wrap gap-2">
                      <label className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                        {selectedZone.photoUrl ? "Change Photo" : "Add Photo"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handlePhotoChange(file);
                            e.currentTarget.value = "";
                          }}
                          disabled={photoBusy}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleSavePhoto}
                        disabled={!pendingPhotoFile || photoBusy}
                        className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Save Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        disabled={(!selectedZone.photoUrl && !pendingPhotoUrl) || photoBusy}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleDeleteZone}
                      className="w-full rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                      Delete green space polygon
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-500">
                  Click a green space polygon to manage its name, photo, or delete it.
                </p>
              )}
            </div>
          </div>
        </aside>

      </div>
    </>
  );
}
