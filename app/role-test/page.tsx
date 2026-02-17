"use client";

import { useCurrentUser } from "@/lib/auth";
import { useRoleConfig } from "@/lib/roles";

export default function RoleTest() {
  const auth = useCurrentUser();
  const roleConfig = useRoleConfig();

  return (
    <div className="min-h-screen bg-gray-950 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🔧 Role System Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication State */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Authentication State
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Loading:</span>
                <span
                  className={
                    auth.isLoading ? "text-yellow-400" : "text-green-400"
                  }
                >
                  {auth.isLoading ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Authenticated:</span>
                <span
                  className={
                    auth.isAuthenticated ? "text-green-400" : "text-red-400"
                  }
                >
                  {auth.isAuthenticated ? "Yes" : "No"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User Name:</span>
                <span className="text-white">{auth.userName || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">User Email:</span>
                <span className="text-white">{auth.userEmail || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Org Name:</span>
                <span className="text-white">{auth.orgName || "None"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Org Type:</span>
                <span
                  className={`font-bold ${
                    auth.orgType === "sponsor"
                      ? "text-blue-400"
                      : auth.orgType === "cde"
                        ? "text-purple-400"
                        : auth.orgType === "investor"
                          ? "text-green-400"
                          : "text-red-400"
                  }`}
                >
                  {auth.orgType || "NONE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Organization ID:</span>
                <span className="text-white text-xs">
                  {auth.organizationId || "None"}
                </span>
              </div>
            </div>
          </div>

          {/* Role Configuration */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Role Configuration
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Config Org Type:</span>
                <span
                  className={`font-bold ${
                    roleConfig.orgType === "sponsor"
                      ? "text-blue-400"
                      : roleConfig.orgType === "cde"
                        ? "text-purple-400"
                        : roleConfig.orgType === "investor"
                          ? "text-green-400"
                          : "text-red-400"
                  }`}
                >
                  {roleConfig.orgType || "NONE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Marketplace Title:</span>
                <span className="text-white">
                  {roleConfig.marketplace.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Entity Type:</span>
                <span className="text-white">
                  {roleConfig.marketplace.entityType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Pipeline Stages:</span>
                <span className="text-white">
                  {roleConfig.pipelineStages.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Nav Items:</span>
                <span className="text-white">{roleConfig.navItems.length}</span>
              </div>
            </div>
          </div>

          {/* User Object */}
          <div className="bg-gray-900 rounded-lg p-6 md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">
              User Object
            </h2>
            <pre className="text-xs text-gray-300 overflow-auto max-h-64 bg-gray-800 p-4 rounded">
              {JSON.stringify(auth.user, null, 2)}
            </pre>
          </div>

          {/* Pipeline Stages */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Pipeline Stages
            </h2>
            <div className="space-y-2">
              {roleConfig.pipelineStages.map((stage, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full bg-${stage.color}-500`}
                  ></div>
                  <span className="text-white text-sm">{stage.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Items */}
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Navigation Items
            </h2>
            <div className="space-y-2">
              {roleConfig.navItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-white text-sm">{item.label}</span>
                  <span className="text-gray-500 text-xs">({item.href})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={() => (window.location.href = "/signin")}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
          >
            Go to Sign In
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500"
          >
            Refresh Page
          </button>
        </div>
      </div>
    </div>
  );
}
