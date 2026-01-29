"use client";

import { useState } from "react";
import { createReport } from "@/controller/reportController";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TargetType = "forum" | "event" | "user";

export default function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
}: {
  open: boolean;
  onClose: () => void;
  targetType: TargetType;
  targetId: string;
}) {
  const [reason, setReason] = useState("spam");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (!open) return null;

  async function submit() {
    setLoading(true);
    setMsg(null);
    try {
      await createReport({
        targetType,
        targetId,
        reason,
        details,
      });
      setMsg("Report submitted. Thank you.");
      setDetails("");
    } catch (e: any) {
      setMsg(e?.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-4 shadow">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Report</h2>
          <button onClick={onClose} className="px-2 text-gray-500 hover:text-black">
            ✕
          </button>
        </div>

        <label className="mt-4 block text-sm font-medium">Reason</label>
        <div className="relative mt-1">
  <select
    className={cn(
      "flex h-10 w-full appearance-none items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 pr-9 text-sm",
      "text-gray-900",
      "focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
      "disabled:cursor-not-allowed disabled:opacity-50"
    )}
    value={reason}
    onChange={(e) => setReason(e.target.value)}
  >
    <option value="spam">Spam</option>
    <option value="harassment">Harassment</option>
    <option value="misinformation">Misinformation</option>
    <option value="impersonation">Impersonation</option>
    <option value="scam">Scam</option>
    <option value="other">Other</option>
  </select>

  {/* Chevron icon like your SelectTrigger */}
  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
    <ChevronDown className="h-4 w-4 opacity-50 text-gray-700" />
  </span>
</div>

        <label className="mt-4 block text-sm font-medium">Details (optional)</label>
        <textarea
          className="mt-1 w-full rounded border px-3 py-2"
          rows={3}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Tell us what happened…"
        />

        {msg && <div className="mt-3 text-sm text-gray-700">{msg}</div>}

        <div className="mt-4 flex gap-2">
          <button
            onClick={submit}
            disabled={loading}
            className="rounded bg-green-600 px-4 py-2 text-white disabled:bg-gray-300"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
          <button onClick={onClose} className="rounded border px-4 py-2">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}