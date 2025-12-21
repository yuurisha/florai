"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminTopNavbar from "../../../components/adminTopNavBar";

import { ICON_KEY_OPTIONS } from "@/lib/learningIcons";
import type { Difficulty, ResourceType, TipCategory, Resource, Tip } from "@/models/Learning";
import {
  addResource,
  addTip,
  deleteResource,
  deleteTip,
  subscribeResources,
  subscribeTips,
  updateResource,
  updateTip,
} from "@/controller/learningContentController";

import { getUserRole } from "@/controller/userController";

const TIP_CATEGORIES: TipCategory[] = ["Watering", "Planting", "Soil Care", "Maintenance", "Nutrition"];
const RESOURCE_TYPES: ResourceType[] = ["Guide", "Video Course", "Reference"];
const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced", "All levels"];

export default function AdminLearningContentPage() {
  const [role, setRole] = useState<"admin" | "user">("user");
  const [checkingRole, setCheckingRole] = useState(true);

  const [tips, setTips] = useState<Tip[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);

  const [tab, setTab] = useState<"tip" | "resource">("tip");
  const [busy, setBusy] = useState(false);

  // ----- Add Tip form
  const [tipTitle, setTipTitle] = useState("");
  const [tipDesc, setTipDesc] = useState("");
  const [tipCategory, setTipCategory] = useState<TipCategory>("Watering");
  const [tipIconKey, setTipIconKey] = useState<string>("droplets");

  // ----- Add Resource form
  const [resTitle, setResTitle] = useState("");
  const [resDesc, setResDesc] = useState("");
  const [resType, setResType] = useState<ResourceType>("Guide");
  const [resDifficulty, setResDifficulty] = useState<Difficulty>("Beginner");
  const [resDuration, setResDuration] = useState("30 min read");
  const [resIconKey, setResIconKey] = useState<string>("bookOpen");
  const [resContent, setResContent] = useState("");

  // ----- Edit modals
  const [editingTip, setEditingTip] = useState<Tip | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);

  // Tip edit fields
  const [eTipTitle, setETipTitle] = useState("");
  const [eTipDesc, setETipDesc] = useState("");
  const [eTipCategory, setETipCategory] = useState<TipCategory>("Watering");
  const [eTipIconKey, setETipIconKey] = useState<string>("droplets");

  // Resource edit fields
  const [eResTitle, setEResTitle] = useState("");
  const [eResDesc, setEResDesc] = useState("");
  const [eResType, setEResType] = useState<ResourceType>("Guide");
  const [eResDifficulty, setEResDifficulty] = useState<Difficulty>("Beginner");
  const [eResDuration, setEResDuration] = useState("30 min read");
  const [eResIconKey, setEResIconKey] = useState<string>("bookOpen");
  const [eResContent, setEResContent] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await getUserRole();
        if (mounted) setRole((r as any) ?? "user");
      } finally {
        if (mounted) setCheckingRole(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const unsubTips = subscribeTips(setTips);
    const unsubResources = subscribeResources(setResources);

    return () => {
      unsubTips();
      unsubResources();
    };
  }, []);

  const forbidden = useMemo(() => !checkingRole && role !== "admin", [checkingRole, role]);

  async function onAddTip() {
    if (!tipTitle.trim() || !tipDesc.trim()) return alert("Tip title + description required.");
    setBusy(true);
    try {
      await addTip({
        title: tipTitle.trim(),
        description: tipDesc.trim(),
        category: tipCategory,
        iconKey: tipIconKey,
      });
      setTipTitle("");
      setTipDesc("");
      setTipCategory("Watering");
      setTipIconKey("droplets");
    } finally {
      setBusy(false);
    }
  }

  async function onAddResource() {
    if (!resTitle.trim() || !resDesc.trim() || !resContent.trim())
      return alert("Resource title + description + content required.");

    setBusy(true);
    try {
      await addResource({
        title: resTitle.trim(),
        description: resDesc.trim(),
        type: resType,
        difficulty: resDifficulty,
        duration: resDuration.trim(),
        iconKey: resIconKey,
        content: resContent.trim(),
      });

      setResTitle("");
      setResDesc("");
      setResType("Guide");
      setResDifficulty("Beginner");
      setResDuration("30 min read");
      setResIconKey("bookOpen");
      setResContent("");
    } finally {
      setBusy(false);
    }
  }

  function openTipEdit(t: Tip) {
    setEditingTip(t);
    setETipTitle(t.title ?? "");
    setETipDesc(t.description ?? "");
    setETipCategory((t.category as TipCategory) ?? "Watering");
    setETipIconKey(t.iconKey ?? "droplets");
  }

  function openResourceEdit(r: Resource) {
    setEditingResource(r);
    setEResTitle(r.title ?? "");
    setEResDesc(r.description ?? "");
    setEResType((r.type as ResourceType) ?? "Guide");
    setEResDifficulty((r.difficulty as Difficulty) ?? "Beginner");
    setEResDuration(r.duration ?? "30 min read");
    setEResIconKey(r.iconKey ?? "bookOpen");
    setEResContent(r.content ?? "");
  }

  async function onSaveTipEdit() {
    if (!editingTip) return;
    if (!eTipTitle.trim() || !eTipDesc.trim()) return alert("Tip title + description required.");

    setBusy(true);
    try {
      await updateTip(editingTip.id, {
        title: eTipTitle.trim(),
        description: eTipDesc.trim(),
        category: eTipCategory,
        iconKey: eTipIconKey,
      });
      setEditingTip(null);
    } finally {
      setBusy(false);
    }
  }

  async function onSaveResourceEdit() {
    if (!editingResource) return;
    if (!eResTitle.trim() || !eResDesc.trim() || !eResContent.trim())
      return alert("Resource title + description + content required.");

    setBusy(true);
    try {
      await updateResource(editingResource.id, {
        title: eResTitle.trim(),
        description: eResDesc.trim(),
        type: eResType,
        difficulty: eResDifficulty,
        duration: eResDuration.trim(),
        iconKey: eResIconKey,
        content: eResContent.trim(),
      });
      setEditingResource(null);
    } finally {
      setBusy(false);
    }
  }

 
  return (
    <div className="min-h-screen bg-gray-50">
     <AdminTopNavbar />
      <div className="container mx-auto max-w-6xl px-4 py-10 space-y-8">
        <div className="rounded-lg border bg-white p-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin: Learning Content</h1>
          <p className="mt-1 text-gray-700">Add, edit & manage Tips and Learning Resources</p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTab("tip")}
              className={`rounded-md px-4 py-2 text-sm font-semibold border ${
                tab === "tip" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white"
              }`}
            >
              Add Tip
            </button>
            <button
              onClick={() => setTab("resource")}
              className={`rounded-md px-4 py-2 text-sm font-semibold border ${
                tab === "resource" ? "bg-emerald-600 text-white border-emerald-600" : "bg-white"
              }`}
            >
              Add Resource
            </button>
          </div>

          {tab === "tip" ? (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Title</label>
                <input
                  value={tipTitle}
                  onChange={(e) => setTipTitle(e.target.value)}
                  className="rounded-md border px-3 py-2"
                  placeholder="e.g. Water Early Morning"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Description</label>
                <textarea
                  value={tipDesc}
                  onChange={(e) => setTipDesc(e.target.value)}
                  className="rounded-md border px-3 py-2 min-h-[90px]"
                  placeholder="Short practical advice…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-gray-800">Category</label>
                  <select
                    value={tipCategory}
                    onChange={(e) => setTipCategory(e.target.value as any)}
                    className="rounded-md border px-3 py-2"
                  >
                    {TIP_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2 sm:col-span-2">
                  <label className="text-sm font-semibold text-gray-800">Icon</label>
                  <select
                    value={tipIconKey}
                    onChange={(e) => setTipIconKey(e.target.value)}
                    className="rounded-md border px-3 py-2"
                  >
                    {ICON_KEY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                disabled={busy}
                onClick={onAddTip}
                className="mt-2 w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Tip"}
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Title</label>
                <input
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  className="rounded-md border px-3 py-2"
                  placeholder="e.g. Sustainable Gardening Practices"
                />
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Description</label>
                <textarea
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="rounded-md border px-3 py-2 min-h-[90px]"
                  placeholder="Short summary here…"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-gray-800">Type</label>
                  <select
                    value={resType}
                    onChange={(e) => setResType(e.target.value as any)}
                    className="rounded-md border px-3 py-2"
                  >
                    {RESOURCE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-gray-800">Difficulty</label>
                  <select
                    value={resDifficulty}
                    onChange={(e) => setResDifficulty(e.target.value as any)}
                    className="rounded-md border px-3 py-2"
                  >
                    {DIFFICULTIES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-semibold text-gray-800">Duration</label>
                  <input
                    value={resDuration}
                    onChange={(e) => setResDuration(e.target.value)}
                    className="rounded-md border px-3 py-2"
                    placeholder="e.g. 45 min read"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Icon</label>
                <select
                  value={resIconKey}
                  onChange={(e) => setResIconKey(e.target.value)}
                  className="rounded-md border px-3 py-2"
                >
                  {ICON_KEY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Content (full text)</label>
                <textarea
                  value={resContent}
                  onChange={(e) => setResContent(e.target.value)}
                  className="rounded-md border px-3 py-2 min-h-[160px]"
                  placeholder="Full content here…"
                />
              </div>

              <button
                disabled={busy}
                onClick={onAddResource}
                className="mt-2 w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Resource"}
              </button>
            </div>
          )}
        </div>

        {/* Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tips */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Tips ({tips.length})</h2>
            <div className="mt-4 space-y-3">
              {tips.map((t) => (
                <div key={t.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{t.title}</div>
                      <div className="text-sm text-gray-700">{t.description}</div>
                      <div className="mt-2 inline-flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getCategoryBadge(t.category)}`}>
                          {t.category}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                          {t.iconKey}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => openTipEdit(t)}
                        className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => deleteTip(t.id)}
                        className="rounded-md px-3 py-1 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {tips.length === 0 && <div className="text-sm text-gray-600">No tips yet.</div>}
            </div>
          </div>

          {/* Resources */}
          <div className="rounded-lg border bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900">Resources ({resources.length})</h2>
            <div className="mt-4 space-y-3">
              {resources.map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900">{r.title}</div>
                      <div className="text-sm text-gray-700">{r.description}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                          {r.type}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                          {r.difficulty}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                          {r.duration}
                        </span>
                        <span className="rounded-full px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800">
                          {r.iconKey}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        disabled={busy}
                        onClick={() => openResourceEdit(r)}
                        className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 text-gray-900 hover:bg-gray-200 disabled:opacity-60"
                      >
                        Edit
                      </button>
                      <button
                        disabled={busy}
                        onClick={() => deleteResource(r.id)}
                        className="rounded-md px-3 py-1 text-sm font-semibold bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-60"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {resources.length === 0 && <div className="text-sm text-gray-600">No resources yet.</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Tip Edit Modal */}
      {editingTip && (
        <ModalShell title="Edit Tip" onClose={() => !busy && setEditingTip(null)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-gray-800">Title</label>
              <input
                value={eTipTitle}
                onChange={(e) => setETipTitle(e.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-gray-800">Description</label>
              <textarea
                value={eTipDesc}
                onChange={(e) => setETipDesc(e.target.value)}
                className="rounded-md border px-3 py-2 min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Category</label>
                <select
                  value={eTipCategory}
                  onChange={(e) => setETipCategory(e.target.value as any)}
                  className="rounded-md border px-3 py-2"
                >
                  {TIP_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <label className="text-sm font-semibold text-gray-800">Icon</label>
                <select
                  value={eTipIconKey}
                  onChange={(e) => setETipIconKey(e.target.value)}
                  className="rounded-md border px-3 py-2"
                >
                  {ICON_KEY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={busy}
                onClick={() => setEditingTip(null)}
                className="rounded-md px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={onSaveTipEdit}
                className="rounded-md px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {/* Resource Edit Modal */}
      {editingResource && (
        <ModalShell title="Edit Resource" onClose={() => !busy && setEditingResource(null)}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-gray-800">Title</label>
              <input
                value={eResTitle}
                onChange={(e) => setEResTitle(e.target.value)}
                className="rounded-md border px-3 py-2"
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-gray-800">Description</label>
              <textarea
                value={eResDesc}
                onChange={(e) => setEResDesc(e.target.value)}
                className="rounded-md border px-3 py-2 min-h-[90px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Type</label>
                <select
                  value={eResType}
                  onChange={(e) => setEResType(e.target.value as any)}
                  className="rounded-md border px-3 py-2"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Difficulty</label>
                <select
                  value={eResDifficulty}
                  onChange={(e) => setEResDifficulty(e.target.value as any)}
                  className="rounded-md border px-3 py-2"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-semibold text-gray-800">Duration</label>
                <input
                  value={eResDuration}
                  onChange={(e) => setEResDuration(e.target.value)}
                  className="rounded-md border px-3 py-2"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-gray-800">Icon</label>
              <select
                value={eResIconKey}
                onChange={(e) => setEResIconKey(e.target.value)}
                className="rounded-md border px-3 py-2"
              >
                {ICON_KEY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-gray-800">Content (full text)</label>
              <textarea
                value={eResContent}
                onChange={(e) => setEResContent(e.target.value)}
                className="rounded-md border px-3 py-2 min-h-[160px]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                disabled={busy}
                onClick={() => setEditingResource(null)}
                className="rounded-md px-4 py-2 text-sm font-semibold bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                disabled={busy}
                onClick={onSaveResourceEdit}
                className="rounded-md px-4 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function getCategoryBadge(category: string) {
  switch (category) {
    case "Watering":
      return "bg-blue-100 text-blue-800";
    case "Planting":
      return "bg-green-100 text-green-800";
    case "Soil Care":
      return "bg-amber-100 text-amber-800";
    case "Maintenance":
      return "bg-yellow-100 text-yellow-800";
    case "Nutrition":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-md px-3 py-1 text-sm font-semibold bg-gray-100 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
