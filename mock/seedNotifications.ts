import { db } from "@/lib/firebaseConfig";
import {
  doc,
  setDoc,
  Timestamp,
  collection,
} from "firebase/firestore";

import { auth } from "@/lib/firebaseConfig";

/**
 * Seeder Script: Creates sample notifications and preferences
 * for testing Phase 1 Notification Module.
 *
 * Run this script manually from a test route or a button click.
 */

export async function seedNotificationTestData() {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("You must be logged in to run the seeder.");
  }

  const uid = user.uid;

  // -----------------------------
  // 1. Seed Notification Preferences (one per user)
  // -----------------------------
  const prefsRef = doc(db, "notificationPreferences", uid);

  await setDoc(prefsRef, {
    enableAiAlerts: true,
    minSeverity: "medium",
    channelInApp: true,
    channelEmail: false,
    frequency: "realtime",
  });

  console.log("✅ Preferences seeded");

  // -----------------------------
  // 2. Seed Notifications (5 sample records)
  // -----------------------------
  const notifCol = collection(db, "notifications");

  const sampleNotifications = [
    {
      type: "ai_alert",
      description: "AI detected high invasive risk in Kuala Lumpur.",
      userID: uid,
      adminID: null,
      predictionID: "pred-001",
      reportID: null,
      read: false,
    },
    {
      type: "ai_alert",
      description: "Plant stress levels increased in your monitored zone.",
      userID: uid,
      adminID: null,
      predictionID: "pred-002",
      reportID: null,
      read: false,
    },
    {
      type: "user_report",
      description: "Your report has been reviewed by an admin.",
      userID: uid,
      adminID: "admin-123",
      predictionID: null,
      reportID: "rep-001",
      read: true,
    },
    {
      type: "ai_alert",
      description: "Low rainfall detected, monitor plant hydration.",
      userID: uid,
      adminID: null,
      predictionID: "pred-003",
      reportID: null,
      read: false,
    },
    {
      type: "user_report",
      description: "Admin flagged a comment as harmful.",
      userID: uid,
      adminID: "admin-999",
      predictionID: null,
      reportID: "rep-002",
      read: false,
    },
  ];

  for (const item of sampleNotifications) {
    const ref = doc(notifCol);

    await setDoc(ref, {
      notificationID: ref.id,
      ...item,
      createdAt: Timestamp.now(),
    });

    console.log(`📌 Notification created: ${ref.id}`);
  }

  console.log("🎉 All seed notifications created successfully.");
}
