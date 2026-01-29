// models/Report.ts

export type ReportTargetType = "forum" | "event" | "user";
export type ReportStatus = "open" | "reviewing" | "resolved" | "rejected";

export interface Report {
  reportID: string;

  createdAt: string;     // ISO string (UI)
  reporterID: string;    // who reported

  targetType: ReportTargetType;
  targetId: string;

  // redirect to admin's user page
  targetUserId: string | null; // owner/offender (or same as targetId when targetType="user")

  reason: string;
  details?: string;

  status: ReportStatus;
  adminNotes?: string | null;

  resolvedAt?: string | null;
  resolvedBy?: string | null;
}


export interface ReportSummary {
  reportID: string;
  targetType: ReportTargetType;
  targetId: string;
  targetUserId: string | null;

  createdAt: string;
  reason?: string;
  reporterID: string;
}
