"use client";

import { useState, useEffect } from "react";
import {
  X,
  MessageCircle,
  Mail,
  Phone,
  Video,
  FileText,
  ExternalLink,
  Send,
  Users,
} from "lucide-react";
import Link from "next/link";

interface Conversation {
  id: string;
  name: string;
  org: string;
  lastMessage: string;
  time: string;
  unread: number;
  online?: boolean;
}

interface MessagesPopupProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount?: number;
}

export default function MessagesPopup({
  isOpen,
  onClose,
  unreadCount = 0,
}: MessagesPopupProps) {
  const [activeTab, setActiveTab] = useState<"messages" | "channels">(
    "messages",
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      // Fetch recent conversations
      fetchConversations();
    }
  }, [isOpen]);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/messages/conversations?limit=5", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
      // Use demo data on error
      setConversations([
        {
          id: "1",
          name: "Demo CDE",
          org: "Community Development Entity",
          lastMessage: "Looking forward to discussing your project...",
          time: "2m ago",
          unread: 2,
          online: true,
        },
        {
          id: "2",
          name: "AIV Advisory",
          org: "American Impact Ventures",
          lastMessage: "The deal structure looks good. Let's schedule a call.",
          time: "1h ago",
          unread: 0,
          online: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Popup Panel */}
      <div className="relative w-full max-w-sm bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden pointer-events-auto mb-16 mr-4 animate-in slide-in-from-bottom-5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/50 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-white">Messages</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab("messages")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "messages"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Direct Messages
          </button>
          <button
            onClick={() => setActiveTab("channels")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "channels"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Deal Rooms
          </button>
        </div>

        {/* Content */}
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : activeTab === "messages" ? (
            <div className="divide-y divide-gray-800">
              {conversations.length === 0 ? (
                <div className="py-8 text-center">
                  <Users className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No conversations yet</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Start a conversation from a deal page
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/messages?id=${conv.id}`}
                    onClick={onClose}
                    className="flex items-start gap-3 p-3 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                        {conv.name.charAt(0)}
                      </div>
                      {conv.online && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-white truncate">
                          {conv.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {conv.time}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">
                        {conv.org}
                      </p>
                      <p className="text-sm text-gray-400 truncate mt-0.5">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">
                        {conv.unread}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          ) : (
            <div className="py-8 text-center">
              <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Deal rooms coming soon</p>
              <p className="text-xs text-gray-500 mt-1">
                Collaborate with your deal team
              </p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-3 bg-gray-800/30 border-t border-gray-700">
          <div className="grid grid-cols-4 gap-2">
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700 transition-colors group"
              title="New Message"
            >
              <Send className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
              <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                Message
              </span>
            </button>
            <a
              href="mailto:support@tcredex.com"
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700 transition-colors group"
              title="Send Email"
            >
              <Mail className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
              <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                Email
              </span>
            </a>
            <a
              href="tel:+18885555555"
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700 transition-colors group"
              title="Call Support"
            >
              <Phone className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
              <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                Call
              </span>
            </a>
            <button
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-gray-700 transition-colors group"
              title="Start Video Call"
            >
              <Video className="w-4 h-4 text-gray-400 group-hover:text-indigo-400" />
              <span className="text-[10px] text-gray-500 group-hover:text-gray-300">
                Video
              </span>
            </button>
          </div>
        </div>

        {/* Footer Link */}
        <Link
          href="/messages"
          onClick={onClose}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
        >
          <span>Open Messages</span>
          <ExternalLink className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
