"use client";
import { createNotificationDoc } from "@/controller/notificationController";
import { useAuth } from "@/context/AuthContext";

import { seedNotificationTestData } from "@/mock/seedNotifications";
export default function TestNotif() {
  const { user } = useAuth();

  const createTest = async () => {
    if (!user) return alert("login first");
    await createNotificationDoc({
      type: "ai_alert",
      description: "Testing notification 3",
      userID: user.uid,
    });
    alert("Created test notification");
  };

  const runSeeder = async () => {
    if (!user) return alert("Please login first.");
    await seedNotificationTestData();
    alert("Seeder completed!");
  };

  return (
    <>
      <button className="p-3 bg-green-600 text-white" onClick={createTest}>
        Create Test Notification
      </button>
      <div className="p-6">
        <button
          onClick={runSeeder}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          Run Notification Seeder
        </button>
      </div>
    </>
  );
}
