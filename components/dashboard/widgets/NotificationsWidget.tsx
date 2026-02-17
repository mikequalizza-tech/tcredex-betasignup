"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
  ChevronRight,
  Check,
} from "lucide-react";
import Link from "next/link";
import { fetchApi, apiPost } from "@/lib/api/fetch-utils";

interface Notification {
  id: string;
  type: "status" | "match" | "document" | "alert" | "info";
  title: string;
  body: string;
  dealId?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsWidgetProps {
  className?: string;
  limit?: number;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  status: Info,
  match: CheckCircle,
  document: CheckCircle,
  alert: AlertCircle,
  info: Info,
};

const TYPE_COLORS: Record<string, string> = {
  status: "text-blue-400",
  match: "text-emerald-400",
  document: "text-purple-400",
  alert: "text-amber-400",
  info: "text-gray-400",
};

export default function NotificationsWidget({
  className = "",
  limit = 5,
}: NotificationsWidgetProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadNotifications depends on limit which is stable (prop with default)
  }, []);

  async function loadNotifications() {
    setLoading(true);
    try {
      const result = await fetchApi<{ notifications: Notification[] }>(
        `/api/notifications?limit=${limit}&unread_first=true`,
      );

      if (result.success && result.data?.notifications) {
        setNotifications(result.data.notifications.slice(0, limit));
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function markAllRead() {
    setMarkingRead(true);
    try {
      await apiPost("/api/notifications", {});
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all read:", err);
    } finally {
      setMarkingRead(false);
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-800 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-amber-400" />
          Notifications
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-black text-[10px] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingRead}
              className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-6">
          <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Info;
            const iconColor = TYPE_COLORS[notification.type] || "text-gray-400";

            return (
              <div
                key={notification.id}
                className={`p-2.5 rounded-lg transition-colors ${
                  notification.read
                    ? "bg-gray-800/30"
                    : "bg-gray-800/60 border-l-2 border-indigo-500"
                }`}
              >
                <div className="flex items-start gap-2">
                  <Icon
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm ${notification.read ? "text-gray-400" : "text-white"}`}
                    >
                      {notification.title}
                    </p>
                    {notification.body && (
                      <p className="text-xs text-gray-500 truncate mt-0.5">
                        {notification.body}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-600 mt-1">
                      {formatTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
