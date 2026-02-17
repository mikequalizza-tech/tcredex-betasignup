"use client";

import { useState } from "react";

interface SettingsSection {
  id: string;
  name: string;
  icon: string;
}

const sections: SettingsSection[] = [
  { id: "general", name: "General", icon: "⚙️" },
  { id: "fees", name: "Fee Structure", icon: "💰" },
  { id: "notifications", name: "Notifications", icon: "🔔" },
  { id: "integrations", name: "Integrations", icon: "🔗" },
  { id: "security", name: "Security", icon: "🔒" },
  { id: "api", name: "API Keys", icon: "🔑" },
];

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState({
    platformName: "tCredex",
    supportEmail: "support@tcredex.com",
    autoMatchEnabled: true,
    requireApproval: true,
    maxDealsPerUser: 50,
    sessionTimeout: 30,
    // Fee settings
    baseFeePercent: 1.8,
    overTenMillionPercent: 1.5,
    feeThreshold: 10000000,
    // Notifications
    emailNotifications: true,
    dealAlerts: true,
    matchNotifications: true,
    weeklyDigest: false,
  });

  const handleSettingChange = (
    key: string,
    value: boolean | string | number,
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Settings Sidebar */}
      <div className="w-64 bg-gray-900 border-r border-gray-800 p-4">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Settings</h2>
        <nav className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                activeSection === section.id
                  ? "bg-indigo-600 text-white"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6">
        {activeSection === "general" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              General Settings
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Configure basic platform settings
            </p>

            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Platform Information
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={settings.platformName}
                      onChange={(e) =>
                        handleSettingChange("platformName", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settings.supportEmail}
                      onChange={(e) =>
                        handleSettingChange("supportEmail", e.target.value)
                      }
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Deal Settings
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        AutoMatch AI
                      </p>
                      <p className="text-xs text-gray-500">
                        Enable automatic deal matching
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          "autoMatchEnabled",
                          !settings.autoMatchEnabled,
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.autoMatchEnabled
                          ? "bg-indigo-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.autoMatchEnabled ? "translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Require Deal Approval
                      </p>
                      <p className="text-xs text-gray-500">
                        Admin must approve new deals
                      </p>
                    </div>
                    <button
                      onClick={() =>
                        handleSettingChange(
                          "requireApproval",
                          !settings.requireApproval,
                        )
                      }
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        settings.requireApproval
                          ? "bg-indigo-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          settings.requireApproval ? "translate-x-6" : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Max Deals Per User
                    </label>
                    <input
                      type="number"
                      value={settings.maxDealsPerUser}
                      onChange={(e) =>
                        handleSettingChange(
                          "maxDealsPerUser",
                          parseInt(e.target.value),
                        )
                      }
                      className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Session Settings
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Session Timeout (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) =>
                      handleSettingChange(
                        "sessionTimeout",
                        parseInt(e.target.value),
                      )
                    }
                    className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "fees" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Fee Structure
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Configure platform fee settings
            </p>

            <div className="space-y-6 max-w-2xl">
              {/* No Risk Banner */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">🛡️</span>
                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-2">
                      No Risk Platform
                    </h3>
                    <p className="text-sm text-gray-300">
                      tCredex operates on a success-based fee model.{" "}
                      <strong className="text-green-400">
                        You don&apos;t close your financing, we don&apos;t get
                        paid.
                      </strong>{" "}
                      Our interests are fully aligned with yours.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Transaction Fees
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Base Fee (up to $10M)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={settings.baseFeePercent}
                          onChange={(e) =>
                            handleSettingChange(
                              "baseFeePercent",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-24 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied to basis amounts up to $10M
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Reduced Fee (over $10M)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={settings.overTenMillionPercent}
                          onChange={(e) =>
                            handleSettingChange(
                              "overTenMillionPercent",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-24 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                        />
                        <span className="text-gray-400">%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied to basis amounts exceeding $10M
                      </p>
                    </div>
                  </div>

                  {/* Fee Calculator Example */}
                  <div className="bg-gray-800 rounded-lg p-4 mt-6">
                    <h4 className="text-sm font-semibold text-gray-300 mb-3">
                      Fee Calculator Example
                    </h4>
                    <p className="text-xs text-gray-500 mb-3">
                      Calculated on basis, not QLICI — fits all deal types
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-gray-400">
                        <span>$8M deal (1.8%):</span>
                        <span className="text-gray-200">$144,000</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>$15M deal ($10M @ 1.8% + $5M @ 1.5%):</span>
                        <span className="text-gray-200">$255,000</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>$25M deal ($10M @ 1.8% + $15M @ 1.5%):</span>
                        <span className="text-gray-200">$405,000</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Fee-for-Service Options
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Additional services are available for complex transactions
                  requiring specialized support.
                </p>
                <ul className="space-y-2 text-sm text-gray-300">
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">•</span>
                    Due diligence assistance
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">•</span>
                    Document preparation support
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">•</span>
                    Expedited processing
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-400">•</span>
                    Complex structure consulting
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeSection === "notifications" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Notification Settings
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Configure email and alert preferences
            </p>

            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Email Notifications
                </h3>

                <div className="space-y-4">
                  {[
                    {
                      key: "emailNotifications",
                      label: "Email Notifications",
                      desc: "Receive notifications via email",
                    },
                    {
                      key: "dealAlerts",
                      label: "Deal Alerts",
                      desc: "Get notified when new deals are submitted",
                    },
                    {
                      key: "matchNotifications",
                      label: "Match Notifications",
                      desc: "Notifications for AutoMatch results",
                    },
                    {
                      key: "weeklyDigest",
                      label: "Weekly Digest",
                      desc: "Receive weekly summary email",
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          {item.label}
                        </p>
                        <p className="text-xs text-gray-500">{item.desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          handleSettingChange(
                            item.key,
                            !settings[item.key as keyof typeof settings],
                          )
                        }
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          settings[item.key as keyof typeof settings]
                            ? "bg-indigo-600"
                            : "bg-gray-700"
                        }`}
                      >
                        <span
                          className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            settings[item.key as keyof typeof settings]
                              ? "translate-x-6"
                              : ""
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "integrations" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Integrations
            </h1>
            <p className="text-sm text-gray-400 mb-6">
              Connect external services
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-3xl">
              {[
                { name: "Google Places API", status: "connected", icon: "📍" },
                { name: "Census Bureau API", status: "connected", icon: "📊" },
                { name: "Mapbox", status: "connected", icon: "🗺️" },
                { name: "SendGrid", status: "pending", icon: "📧" },
                { name: "DocuSign", status: "disconnected", icon: "✍️" },
                { name: "Stripe", status: "disconnected", icon: "💳" },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="bg-gray-900 border border-gray-800 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{integration.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-200">
                          {integration.name}
                        </p>
                        <span
                          className={`text-xs ${
                            integration.status === "connected"
                              ? "text-green-400"
                              : integration.status === "pending"
                                ? "text-yellow-400"
                                : "text-gray-500"
                          }`}
                        >
                          {integration.status.charAt(0).toUpperCase() +
                            integration.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300">
                      {integration.status === "connected"
                        ? "Configure"
                        : "Connect"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === "security" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">Security</h1>
            <p className="text-sm text-gray-400 mb-6">
              Security and access settings
            </p>

            <div className="space-y-6 max-w-2xl">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">
                  Authentication
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Two-Factor Authentication
                      </p>
                      <p className="text-xs text-gray-500">
                        Require 2FA for all admin users
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs bg-green-500/20 text-green-400 rounded">
                      Enabled
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        SSO Integration
                      </p>
                      <p className="text-xs text-gray-500">
                        Single Sign-On via SAML/OAuth
                      </p>
                    </div>
                    <button className="text-xs text-indigo-400 hover:text-indigo-300">
                      Configure
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "api" && (
          <div>
            <h1 className="text-2xl font-bold text-gray-100 mb-2">API Keys</h1>
            <p className="text-sm text-gray-400 mb-6">
              Manage API access credentials
            </p>

            <div className="space-y-6 max-w-3xl">
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-100">
                    Active API Keys
                  </h3>
                  <button className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
                    + Generate New Key
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        Production Key
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        tcx_live_****************************1234
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300">
                        Regenerate
                      </button>
                      <button className="text-xs text-red-400 hover:text-red-300">
                        Revoke
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-200">
                        Test Key
                      </p>
                      <p className="text-xs text-gray-500 font-mono">
                        tcx_test_****************************5678
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-xs text-indigo-400 hover:text-indigo-300">
                        Regenerate
                      </button>
                      <button className="text-xs text-red-400 hover:text-red-300">
                        Revoke
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="max-w-2xl mt-8">
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
