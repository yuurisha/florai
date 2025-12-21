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
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-800">Enable AI alerts</div>
            <div className="text-xs text-gray-500">
              Receive notifications when AI detects potential risks.
            </div>
          </div>
          <input
            type="checkbox"
            checked={preferences.enableAiAlerts}
            onChange={(e) =>
              handleChange({ enableAiAlerts: e.target.checked })
            }
          />
        </div>

        <div>
          <div className="font-medium text-gray-800 mb-1">Minimum severity</div>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={preferences.minSeverity}
            onChange={(e) =>
              handleChange({ minSeverity: e.target.value as any })
            }
          >
            <option value="low">Low and above</option>
            <option value="medium">Medium and above</option>
            <option value="high">High only</option>
          </select>
        </div>

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
            <label className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={preferences.channelEmail}
                onChange={(e) =>
                  handleChange({ channelEmail: e.target.checked })
                }
              />
              Email
            </label>
          </div>
        </div>

        <div>
          <div className="font-medium text-gray-800 mb-1">Frequency</div>
          <select
            className="border rounded-md px-2 py-1 text-sm"
            value={preferences.frequency}
            onChange={(e) =>
              handleChange({ frequency: e.target.value as any })
            }
          >
            <option value="realtime">Real-time</option>
            <option value="daily">Daily summary</option>
            <option value="weekly">Weekly summary</option>
          </select>
        </div>
      </div>
    </div>
    </>
  );
}
