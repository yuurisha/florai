"use client";

import { useNotifications } from "@/context/NotificationContext";
import { NotificationPreferences } from "@/models/Notifications";
import TopNavbar from "@/components/TopNavBar";
export default function NotificationSettingsPage() {
  const { preferences, setPreferences } = useNotifications();

  if (!preferences) {
    return <div className="p-6 text-sm text-gray-500">Loading preferences…</div>;
  }

  const handleChange = (patch: Partial<NotificationPreferences>) => {
    setPreferences({ ...preferences, ...patch });
  };

  return (
    <>
      <TopNavbar />
      <div className="p-6 max-w-xl">
        <h1 className="text-xl font-semibold mb-4 text-gray-800">
          Notification Settings
        </h1>
      <div className="space-y-6 bg-white p-4 rounded-xl shadow-sm border text-sm">
        <div>
          <div className="font-medium text-gray-800 mb-1">Delivery channels</div>
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={preferences.channelInApp}
                onChange={(e) =>
                  handleChange({ channelInApp: e.target.checked })
                }
              />
              In-app
            </label>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
