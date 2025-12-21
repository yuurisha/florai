import type { Timestamp } from "firebase/firestore";

export type ActivityLogDoc = {
  action: "delete" | "create" | "update" | string;
  entityType: "learningTip" | "learningResource" | string;

  entityCollection?: string | null;
  entityId: string;
  entityTitle?: string | null;

  actorUid?: string | null;
  actorEmail?: string | null;
  actorName?: string | null;

  // Snapshot. For deletes, store the previous data.
  deletedData?: any;

  createdAt?: Timestamp;
  createdAtMs?: number; 
};

export type ActivityLog = ActivityLogDoc & { id: string };
