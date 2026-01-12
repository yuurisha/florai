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
    let cancelled = false;
    const interval = window.setInterval(() => {
      const hasDraw = document.querySelector(".leaflet-draw-draw-polygon");
      const hasEdit = document.querySelector(".leaflet-draw-edit-edit");
      const hasDelete = document.querySelector(".leaflet-draw-edit-remove");
      if (hasDraw && hasEdit && hasDelete && !cancelled) {
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
        <div className="relative flex-1 p-4">
          <div className="h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="h-full w-full">
              <MapClient
                mode="admin"
                onZoneSelect={(zone) => setSelectedZone(zone)}
                refreshKey={refreshKey}
                mapId="admin-map"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="absolute right-2 top-1/2 z-[1000] flex h-12 w-9 -translate-y-1/2 items-center justify-center rounded-l-xl border border-slate-200 bg-white text-lg font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            aria-label={sidebarOpen ? "Hide panel" : "Show panel"}
          >
            {sidebarOpen ? "›" : "‹"}
          </button>
        </div>

        <aside
          className={`w-full border-t border-slate-200 bg-white transition-all xl:border-l xl:border-t-0 ${
            sidebarOpen ? "xl:w-80 xl:p-4" : "xl:w-0 xl:p-0 xl:opacity-0"
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
                        Total uploads: {selectedZone.totalUploads ?? 0}
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
