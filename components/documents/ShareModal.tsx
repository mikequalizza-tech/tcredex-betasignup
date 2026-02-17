"use client";

import { useState } from "react";
import { Document, DocumentShare, AccessLevel } from "@/lib/documents/types";

interface ShareModalProps {
  document: Document;
  onClose: () => void;
  onShare: (share: Omit<DocumentShare, "id" | "sharedAt" | "sharedBy">) => void;
  onRemoveShare: (shareId: string) => void;
}

interface UserSuggestion {
  id: string;
  name: string;
  email: string;
  type: "user" | "organization";
}

// Demo users for autocomplete
const demoUsers: UserSuggestion[] = [
  { id: "u1", name: "John Smith", email: "john@example.com", type: "user" },
  { id: "u2", name: "Sarah Johnson", email: "sarah@example.com", type: "user" },
  { id: "u3", name: "Mike Brown", email: "mike@example.com", type: "user" },
  {
    id: "o1",
    name: "Midwest CDE",
    email: "team@midwestcde.com",
    type: "organization",
  },
  {
    id: "o2",
    name: "Great Lakes Investments",
    email: "team@glfinance.com",
    type: "organization",
  },
];

export default function ShareModal({
  document,
  onClose,
  onShare,
  onRemoveShare,
}: ShareModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSuggestion | null>(null);
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("viewer");
  const [canReshare, setCanReshare] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredUsers = demoUsers.filter(
    (u) =>
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())) &&
      !document.shares.some((s) => s.sharedWith.id === u.id),
  );

  const handleSelectUser = (user: UserSuggestion) => {
    setSelectedUser(user);
    setSearchQuery(user.name);
    setShowSuggestions(false);
  };

  const handleShare = () => {
    if (!selectedUser) return;

    onShare({
      sharedWith: {
        type: selectedUser.type,
        id: selectedUser.id,
        name: selectedUser.name,
      },
      accessLevel,
      canReshare,
      expiresAt: expiresAt || undefined,
    });

    setSelectedUser(null);
    setSearchQuery("");
    setAccessLevel("viewer");
    setCanReshare(false);
    setExpiresAt("");
  };

  const accessLevelLabels: Record<
    AccessLevel,
    { label: string; description: string }
  > = {
    owner: {
      label: "Owner",
      description: "Full control including delete and transfer ownership",
    },
    admin: {
      label: "Admin",
      description: "Can edit, share, and manage access",
    },
    editor: {
      label: "Editor",
      description: "Can view and upload new versions",
    },
    viewer: { label: "Viewer", description: "View and download only" },
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">
              Share Document
            </h2>
            <p className="text-sm text-gray-400">{document.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Search for users */}
          <div className="relative mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Share with user or organization
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedUser(null);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search by name or email..."
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
            />

            {/* Suggestions dropdown */}
            {showSuggestions && searchQuery && filteredUsers.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <li
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="px-4 py-3 hover:bg-gray-700 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          user.type === "organization"
                            ? "bg-purple-600"
                            : "bg-indigo-600"
                        } text-white text-sm font-medium`}
                      >
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-gray-200">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <span className="ml-auto text-xs text-gray-500 capitalize">
                        {user.type}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Access level */}
          {selectedUser && (
            <div className="space-y-4 mb-6 p-4 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    selectedUser.type === "organization"
                      ? "bg-purple-600"
                      : "bg-indigo-600"
                  } text-white font-medium`}
                >
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <p className="text-gray-200 font-medium">
                    {selectedUser.name}
                  </p>
                  <p className="text-sm text-gray-500">{selectedUser.type}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Access Level
                </label>
                <div className="space-y-2">
                  {(["viewer", "editor", "admin"] as AccessLevel[]).map(
                    (level) => (
                      <label
                        key={level}
                        className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border ${
                          accessLevel === level
                            ? "border-indigo-500 bg-indigo-900/20"
                            : "border-gray-700 hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          name="accessLevel"
                          checked={accessLevel === level}
                          onChange={() => setAccessLevel(level)}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-gray-200 font-medium">
                            {accessLevelLabels[level].label}
                          </p>
                          <p className="text-xs text-gray-500">
                            {accessLevelLabels[level].description}
                          </p>
                        </div>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canReshare}
                    onChange={(e) => setCanReshare(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-800 text-indigo-500"
                  />
                  <span className="text-sm text-gray-300">Can reshare</span>
                </label>

                <div className="flex-1">
                  <label className="text-sm text-gray-300 mr-2">Expires:</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded text-gray-300 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleShare}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium"
              >
                Share
              </button>
            </div>
          )}

          {/* Current shares */}
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">
              People with access ({document.shares.length + 1})
            </h3>

            {/* Owner */}
            <div className="flex items-center justify-between py-3 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {document.owner.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm text-gray-200">{document.owner.name}</p>
                  <p className="text-xs text-gray-500">
                    {document.owner.email}
                  </p>
                </div>
              </div>
              <span className="text-xs text-green-400 font-medium">Owner</span>
            </div>

            {/* Shared users */}
            {document.shares.map((share) => (
              <div
                key={share.id}
                className="flex items-center justify-between py-3 border-b border-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      share.sharedWith.type === "organization"
                        ? "bg-purple-600"
                        : "bg-indigo-600"
                    } text-white text-sm font-medium`}
                  >
                    {share.sharedWith.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-200">
                      {share.sharedWith.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      Shared by {share.sharedBy.name}
                      {share.expiresAt &&
                        ` • Expires ${new Date(share.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 capitalize">
                    {share.accessLevel}
                  </span>
                  <button
                    onClick={() => onRemoveShare(share.id)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-between items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={document.isPublic}
              onChange={() => {}}
              className="rounded border-gray-600 bg-gray-800 text-indigo-500"
            />
            <span className="text-sm text-gray-300">
              Anyone with link can view
            </span>
          </label>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
