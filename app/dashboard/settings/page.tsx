"use client";

import React, { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/auth";

interface UserSettings {
  fullName: string;
  email: string;
  phone: string;
  title: string;
  organization: string;
  timezone: string;
  emailNotifications: boolean;
  dealAlerts: boolean;
  documentAlerts: boolean;
  weeklyDigest: boolean;
  twoFactorEnabled: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  fullName: "",
  email: "",
  phone: "",
  title: "",
  organization: "",
  timezone: "America/Chicago",
  emailNotifications: true,
  dealAlerts: true,
  documentAlerts: true,
  weeklyDigest: false,
  twoFactorEnabled: false,
};

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
];

export default function SettingsPage() {
  const {
    orgType: _orgType,
    isAuthenticated,
    isLoading,
    userName,
    userEmail,
    orgName,
    user,
  } = useCurrentUser();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update settings with actual logged-in user data
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      setSettings((prev) => ({
        ...prev,
        fullName: userName || "User",
        email: userEmail || "",
        organization: orgName || "",
      }));
      if (user?.avatar) {
        setAvatarUrl(user.avatar);
      }
    }
  }, [userName, userEmail, orgName, isAuthenticated, isLoading, user?.avatar]);
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "security"
  >("profile");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleInputChange = (
    field: keyof UserSettings,
    value: string | boolean,
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      alert("File too large. Maximum size is 1MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Upload failed");
        return;
      }
      setAvatarUrl(data.url);
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-1">
          Manage your account and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="border-b border-gray-800">
          <nav className="flex -mb-px">
            {[
              {
                id: "profile",
                label: "Profile",
                icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
              },
              {
                id: "notifications",
                label: "Notifications",
                icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
              },
              {
                id: "security",
                label: "Security",
                icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-500 text-indigo-400"
                    : "border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-700"
                }`}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={tab.icon}
                  />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={settings.fullName}
                    className="w-20 h-20 rounded-full object-cover border border-indigo-500/30"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-indigo-900/50 border border-indigo-500/30 flex items-center justify-center text-2xl font-bold text-indigo-400">
                    {settings.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                )}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Change Photo"}
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    JPG, GIF or PNG. Max 1MB
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={settings.fullName}
                    onChange={(e) =>
                      handleInputChange("fullName", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Organization
                  </label>
                  <div className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-400">
                    {settings.organization || "Not set"}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Edit organization name in{" "}
                    <a
                      href="/dashboard/teams"
                      className="text-indigo-400 hover:text-indigo-300"
                    >
                      Team Settings
                    </a>
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    value={settings.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={settings.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Timezone
                  </label>
                  <select
                    value={settings.timezone}
                    onChange={(e) =>
                      handleInputChange("timezone", e.target.value)
                    }
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === "notifications" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-100">
                    Email Notifications
                  </div>
                  <div className="text-sm text-gray-400">
                    Receive email notifications for important updates
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      handleInputChange("emailNotifications", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-100">Deal Alerts</div>
                  <div className="text-sm text-gray-400">
                    Get notified when deals match your criteria or change status
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.dealAlerts}
                    onChange={(e) =>
                      handleInputChange("dealAlerts", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-100">
                    Document Alerts
                  </div>
                  <div className="text-sm text-gray-400">
                    Get notified when documents are uploaded or require action
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.documentAlerts}
                    onChange={(e) =>
                      handleInputChange("documentAlerts", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-100">Weekly Digest</div>
                  <div className="text-sm text-gray-400">
                    Receive a weekly summary of your activity and opportunities
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.weeklyDigest}
                    onChange={(e) =>
                      handleInputChange("weeklyDigest", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                </label>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-100">Password</div>
                    <div className="text-sm text-gray-400">
                      Last changed 30 days ago
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
                    Change Password
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-100">
                      Two-Factor Authentication
                    </div>
                    <div className="text-sm text-gray-400">
                      {settings.twoFactorEnabled
                        ? "Enabled"
                        : "Add an extra layer of security to your account"}
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleInputChange(
                        "twoFactorEnabled",
                        !settings.twoFactorEnabled,
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.twoFactorEnabled
                        ? "bg-red-900/50 text-red-300 border border-red-500/30 hover:bg-red-900/70"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    }`}
                  >
                    {settings.twoFactorEnabled ? "Disable" : "Enable"}
                  </button>
                </div>
              </div>

              <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-100">
                      Active Sessions
                    </div>
                    <div className="text-sm text-gray-400">
                      Manage your active login sessions
                    </div>
                  </div>
                  <button className="px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors">
                    View Sessions
                  </button>
                </div>
              </div>

              <div className="p-4 border border-red-500/30 bg-red-900/20 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-red-300">
                      Delete Account
                    </div>
                    <div className="text-sm text-red-400/80">
                      Permanently delete your account and all data
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors">
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
          {saved && (
            <div className="flex items-center gap-2 text-green-400">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Settings saved successfully
            </div>
          )}
          {!saved && <div />}
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
