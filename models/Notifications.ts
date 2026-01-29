import type { PredictionSummary } from "./Prediction";
import type { ReportSummary } from "./Report";

export type NotificationType = "ai_alert" | "user_report" | "um_special_alert";

export interface Notification {
  _id: string;
  notificationID: string;
  type: NotificationType;

  // Core fields
  description: string;
  createdAt: string;
  read: boolean;
  receiveNotifications: boolean;

  // Foreign Keys (depending on type)
  reportID?: string;        // For admin alerts about user reports
  predictionID?: string;    // AI alerts (you must add this FK in DB)
  userID: string;           
  adminID?: string;
  prediction?: PredictionSummary;  // for AI alerts
  report?: ReportSummary;          // for user reports

  // Derived from Prediction (if AI alert)
  latitude?: number;
  longitude?: number;
  temperature?: number;
  rainfall?: number;
  humidity?: number;
  predictedSpread?: number;
  predictedRisk?: string;
}

export type NotificationSeverity = "low" | "medium" | "high";

export interface NotificationPreferences {
  enableAiAlerts: boolean;
  minSeverity: NotificationSeverity;
  channelInApp: boolean;
  channelEmail: boolean;
  frequency: "realtime" | "daily" | "weekly";
  lastUpdated?: string;
  userId?: string; // <-- added
}

export type { PredictionSummary, ReportSummary };
