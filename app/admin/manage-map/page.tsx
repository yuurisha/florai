"use client";

import { useEffect, useState } from "react";
import MapClient from "@/components/MapClient";
import AdminTopNavBar from "@/components/adminTopNavBar";
import { GreenSpace } from "@/models/greenSpace";
import toast from "react-hot-toast";
import {
  deleteGreenSpace,
  updateGreenSpaceHealth,
  removeGreenSpacePhoto,
  updateGreenSpaceMeta,
  uploadGreenSpacePhoto,
} from "@/controller/greenSpaceController";
import { fetchGreenSpaces } from "@/controller/greenSpaceController";
import { collection, getDocs, orderBy, query, where, Timestamp } from "firebase/firestore";
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
  const [healthWindowDays, setHealthWindowDays] = useState<1 | 30>(30);
  const [analyticsView, setAnalyticsView] = useState<"chart" | "table">("chart");
  const [analyticsStart, setAnalyticsStart] = useState<string>("");
  const [analyticsEnd, setAnalyticsEnd] = useState<string>("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [analyticsRows, setAnalyticsRows] = useState<
    { id: string; name: string; total: number; dailyAvg: number }[]
  >([]);
  const [analyticsDaily, setAnalyticsDaily] = useState<{ day: string; total: number }[]>([]);

  const initAnalyticsRange = () => {
    const end = new Date();
    const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const toISODate = (d: Date) => d.toISOString().slice(0, 10);
    return { start: toISODate(start), end: toISODate(end) };
  };

  const getRollingWindowLabel = (days: number) => (days === 1 ? "Daily" : "Monthly");

  const getWindowStats = (zone: GreenSpace) => {
    if (healthWindowDays === 1) {
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
    if (analyticsStart || analyticsEnd) return;
    const range = initAnalyticsRange();
    setAnalyticsStart(range.start);
    setAnalyticsEnd(range.end);
  }, [analyticsStart, analyticsEnd]);

  useEffect(() => {
    if (!analyticsStart || !analyticsEnd) return;
    if (analyticsRows.length > 0 || analyticsLoading) return;
    refreshAnalytics();
  }, [analyticsStart, analyticsEnd, analyticsRows.length, analyticsLoading]);

  const refreshAnalytics = async () => {
    if (!analyticsStart || !analyticsEnd) return;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const [zones, uploadsSnap] = await Promise.all([
        fetchGreenSpaces(),
        getDocs(
          query(
            collection(db, "uploads"),
            where("createdAt", ">=", Timestamp.fromDate(new Date(analyticsStart))),
            where("createdAt", "<=", Timestamp.fromDate(new Date(`${analyticsEnd}T23:59:59`))),
            orderBy("createdAt", "asc")
          )
        ),
      ]);

      const zoneMap = new Map(zones.map((zone) => [zone.id, zone.name]));
      const totals = new Map<string, number>();
      const daily = new Map<string, number>();

      uploadsSnap.docs.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const zoneId = data?.greenSpaceId as string | undefined;
        if (!zoneId) return;
        totals.set(zoneId, (totals.get(zoneId) ?? 0) + 1);

        const createdAt = data?.createdAt;
        const createdAtDate =
          createdAt && typeof createdAt.toDate === "function" ? createdAt.toDate() : null;
        if (!createdAtDate) return;
        const dayKey = createdAtDate.toISOString().slice(0, 10);
        daily.set(dayKey, (daily.get(dayKey) ?? 0) + 1);
      });

      const startDate = new Date(analyticsStart);
      const endDate = new Date(analyticsEnd);
      const dayCount =
        Math.max(
          1,
          Math.floor((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1
        );

      const rows = Array.from(zoneMap.entries()).map(([id, name]) => {
        const total = totals.get(id) ?? 0;
        return {
          id,
          name,
          total,
          dailyAvg: Number((total / dayCount).toFixed(2)),
        };
      });

      rows.sort((a, b) => b.total - a.total);

      const dailyRows = Array.from(daily.entries())
        .map(([day, total]) => ({ day, total }))
        .sort((a, b) => a.day.localeCompare(b.day));

      setAnalyticsRows(rows);
      setAnalyticsDaily(dailyRows);
    } catch (err) {
      console.error(err);
      setAnalyticsError("Failed to load analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    if (healthWindowDays !== 1) return;
    let active = true;

    (async () => {
      try {
        const zones = await fetchGreenSpaces();
        const missing = zones.filter(
          (zone) => zone.totalUploads5 == null || zone.healthIndex5 === undefined
        );
        if (missing.length === 0) return;
        await Promise.all(missing.map((zone) => updateGreenSpaceHealth(zone.id)));
        const refreshed = await fetchGreenSpaces();
        if (!active) return;
        if (selectedZone) {
          const updated = refreshed.find((zone) => zone.id === selectedZone.id);
          if (updated) setSelectedZone(updated);
        }
        setRefreshKey((v) => v + 1);
        if (!analyticsLoading) await refreshAnalytics();
      } catch (err) {
        console.error("Failed to backfill daily health stats:", err);
      }
    })();

    return () => {
      active = false;
    };
  }, [healthWindowDays, selectedZone, analyticsStart, analyticsEnd]);

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
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setHealthWindowDays(1)}
                    className={`rounded-full border px-3 py-1 font-semibold ${
                      healthWindowDays === 1
                        ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Daily
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
                  Admin Analytics
                </h3>
                <p className="text-xs text-slate-600">
                  Aggregated submission activity by green space and time range.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">View</span>
                <button
                  type="button"
                  onClick={() => setAnalyticsView("chart")}
                  className={`rounded-full border px-3 py-1 font-semibold ${
                    analyticsView === "chart"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Chart
                </button>
                <button
                  type="button"
                  onClick={() => setAnalyticsView("table")}
                  className={`rounded-full border px-3 py-1 font-semibold ${
                    analyticsView === "table"
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Table
                </button>
                <button
                  type="button"
                  onClick={refreshAnalytics}
                  disabled={analyticsLoading}
                  className="inline-flex items-center gap-2 rounded border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-end gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={analyticsStart}
                    onChange={(e) => setAnalyticsStart(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600">
                    End date
                  </label>
                  <input
                    type="date"
                    value={analyticsEnd}
                    onChange={(e) => setAnalyticsEnd(e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={refreshAnalytics}
                  disabled={!analyticsStart || !analyticsEnd || analyticsLoading}
                  className="inline-flex items-center gap-2 rounded border border-emerald-600 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:border-slate-200 disabled:text-slate-400"
                >
                  Apply range
                </button>
              </div>

              {analyticsLoading ? (
                <div className="text-sm text-slate-600">Loading analytics…</div>
              ) : analyticsError ? (
                <div className="text-sm text-red-600">{analyticsError}</div>
              ) : analyticsView === "chart" ? (
                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="text-xs font-semibold text-slate-600">
                    Daily uploads (all green spaces)
                  </div>
                  {analyticsDaily.length === 0 ? (
                    <div className="mt-2 text-sm text-slate-500">
                      No uploads in this range.
                    </div>
                  ) : (
                    <div className="mt-4 flex h-40 items-end gap-1">
                      {analyticsDaily.map((row) => {
                        const max = Math.max(...analyticsDaily.map((d) => d.total), 1);
                        const height = Math.round((row.total / max) * 100);
                        return (
                          <div key={row.day} className="flex-1">
                            <div
                              className="w-full rounded-t bg-emerald-500/80"
                              style={{ height: `${height}%` }}
                              title={`${row.day}: ${row.total}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Green space</th>
                        <th className="px-3 py-2">Total uploads</th>
                        <th className="px-3 py-2">Daily average</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {analyticsRows.map((row) => (
                        <tr key={row.id} className="bg-white">
                          <td className="px-3 py-3 font-medium text-slate-900">
                            {row.name}
                          </td>
                          <td className="px-3 py-3">{row.total}</td>
                          <td className="px-3 py-3">{row.dailyAvg}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
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
