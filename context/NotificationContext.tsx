"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Notification,
  NotificationPreferences,
} from "@/models/Notifications";

import {
  fetchUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/controller/notificationController";

import {
  fetchNotificationPreferences,
  updateNotificationPreferences,
} from "@/controller/notificationPreferenceController";

import { useAuth } from "@/context/AuthContext";

// ----------------------------------------------------
// Context Type
// ----------------------------------------------------
interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;

  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  setPreferences: (prefs: NotificationPreferences) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
};

// ----------------------------------------------------
// Provider
// ----------------------------------------------------
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferencesState] =
    useState<NotificationPreferences | null>(null);

  // ----------------------------------------------------
  // Load notifications + preferences when user logs in
  // ----------------------------------------------------
  useEffect(() => {
    if (!user) return; // wait for login

    const load = async () => {
      try {
        const [loadedNotifications, loadedPrefs] = await Promise.all([
          fetchUserNotifications(user.uid),
          fetchNotificationPreferences(user.uid),
        ]);

        setNotifications(loadedNotifications);
        setPreferencesState(loadedPrefs);
      } catch (err) {
        console.error("❌ Failed to load notification data:", err);
      }
    };

    load();
  }, [user]);

  // ----------------------------------------------------
  // Actions
  // ----------------------------------------------------
  const markAsRead = async (id: string) => {
    try {
      await markNotificationRead(id);

      // update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationID === id ? { ...n, read: true } : n
        )
      );
    } catch (err) {
      console.error("❌ Failed to mark notification read:", err);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      await markAllNotificationsRead(user.uid);

      // update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error("❌ Failed to mark all notifications read:", err);
    }
  };

  const setPreferences = async (prefs: NotificationPreferences) => {
    if (!user) return;

    try {
      await updateNotificationPreferences(user.uid, prefs);
      setPreferencesState(prefs);
    } catch (err) {
      console.error("❌ Failed to update prefs:", err);
    }
  };

  // ----------------------------------------------------
  // Derived state
  // ----------------------------------------------------
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ----------------------------------------------------
  // Provide value
  // ----------------------------------------------------
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        preferences,
        markAsRead,
        markAllAsRead,
        setPreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};
