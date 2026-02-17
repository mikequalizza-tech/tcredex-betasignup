"use client";

import { useState } from "react";

interface Conversation {
  id: string;
  type: "team" | "cde" | "investor" | "sponsor" | "deal";
  name: string;
  deal_id?: string;
  deal_name?: string;
  last_message?: string;
  last_message_at?: string;
  unread_count: number;
  participants: {
    user_id: string;
    name: string;
    organization: string;
    role: string;
  }[];
}

interface MessagesSidebarProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  onSelectConversation: (conv: Conversation) => void;
  onNewConversation: () => void;
  categories: Record<string, { name: string; icon: string; color: string }>;
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  loading: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// Format time helper
function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  } else if (diffHours < 168) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

// Get initials from name
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function MessagesSidebar({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  categories,
  activeCategory,
  onCategoryChange,
  loading,
  sidebarOpen,
  onToggleSidebar: _onToggleSidebar,
}: MessagesSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div
      className={`absolute z-20 top-0 bottom-0 w-full md:w-auto md:static md:top-auto md:bottom-auto -mr-px md:translate-x-0 transition-transform duration-200 ease-in-out ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="sticky top-16 bg-gray-900 overflow-x-hidden overflow-y-auto no-scrollbar shrink-0 border-r border-gray-800 md:w-[18rem] xl:w-[20rem] h-[calc(100dvh-104px)]">
        {/* Header */}
        <div className="sticky top-0 z-10">
          <div className="flex items-center bg-gray-900 border-b border-gray-800 px-5 h-16">
            <div className="w-full flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-100">Messages</h2>
              <button
                onClick={onNewConversation}
                className="p-1.5 shrink-0 rounded-lg border border-gray-700 hover:border-gray-600 shadow-sm bg-gray-800 text-gray-400 hover:text-indigo-400 transition-colors"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-4">
          {/* Search */}
          <form className="relative mb-4">
            <label htmlFor="msg-search" className="sr-only">
              Search
            </label>
            <input
              id="msg-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="form-input w-full pl-9 bg-gray-800 border-gray-700 focus:bg-gray-800 focus:border-indigo-500 text-sm text-gray-100 placeholder-gray-500 rounded-lg"
            />
            <button
              className="absolute inset-0 right-auto group"
              type="submit"
              aria-label="Search"
            >
              <svg
                className="shrink-0 fill-current text-gray-500 group-hover:text-gray-400 ml-3 mr-2"
                width="16"
                height="16"
                viewBox="0 0 16 16"
              >
                <path d="M7 14c-3.86 0-7-3.14-7-7s3.14-7 7-7 7 3.14 7 7-3.14 7-7 7zM7 2C4.243 2 2 4.243 2 7s2.243 5 5 5 5-2.243 5-5-2.243-5-5-5z" />
                <path d="M15.707 14.293L13.314 11.9a8.019 8.019 0 01-1.414 1.414l2.393 2.393a.997.997 0 001.414 0 .999.999 0 000-1.414z" />
              </svg>
            </button>
          </form>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(categories).map(([key, config]) => (
              <button
                key={key}
                onClick={() => onCategoryChange(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === key
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                }`}
              >
                {config.name}
              </button>
            ))}
          </div>

          {/* Conversations */}
          <div className="mt-4">
            <div className="text-xs font-semibold text-gray-500 uppercase mb-3">
              Conversations
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400">No conversations yet</p>
                <button
                  onClick={onNewConversation}
                  className="text-sm text-indigo-400 hover:text-indigo-300 mt-2"
                >
                  Start a conversation
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {filteredConversations.map((conversation) => {
                  const isActive = activeConversation?.id === conversation.id;
                  return (
                    <li key={conversation.id} className="-mx-2">
                      <button
                        onClick={() => onSelectConversation(conversation)}
                        className={`flex items-center justify-between w-full p-2 rounded-lg transition-colors ${
                          isActive
                            ? "bg-indigo-600/20 border border-indigo-500/30"
                            : "hover:bg-gray-800"
                        }`}
                      >
                        <div className="flex items-center truncate">
                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold mr-2 shrink-0">
                            {getInitials(conversation.name)}
                          </div>
                          <div className="truncate text-left">
                            <span
                              className={`text-sm font-medium ${isActive ? "text-indigo-400" : "text-gray-100"}`}
                            >
                              {conversation.name}
                            </span>
                            {conversation.last_message && (
                              <p className="text-xs text-gray-400 truncate mt-0.5">
                                {conversation.last_message}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center ml-2 shrink-0">
                          {conversation.unread_count > 0 ? (
                            <div className="text-xs inline-flex font-medium bg-indigo-500 text-white rounded-full text-center leading-5 px-2">
                              {conversation.unread_count}
                            </div>
                          ) : conversation.last_message_at ? (
                            <span className="text-xs text-gray-500">
                              {formatTime(conversation.last_message_at)}
                            </span>
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
