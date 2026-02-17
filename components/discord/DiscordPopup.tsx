"use client";

import { useState, useEffect, useRef } from "react";
// Local interfaces matching the API response shapes
interface DiscordMember {
  id: string;
  userId: string;
  serverId: string;
  role: "ADMIN" | "MODERATOR" | "GUEST";
  createdAt?: string | null;
}

interface DiscordChannel {
  id: string;
  name: string;
  type: string;
  serverId: string;
  description?: string | null;
  isPrivate?: boolean;
  createdAt?: string | null;
}

interface DiscordServer {
  id: string;
  name: string;
  imageUrl?: string | null;
  inviteCode?: string;
  ownerId?: string;
  organizationId?: string | null;
  dealId?: string | null;
  serverType?: string;
  createdAt?: string | null;
  channels: DiscordChannel[];
  members: DiscordMember[];
}

interface DiscordMessage {
  id: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  deleted?: boolean;
  edited?: boolean;
  memberId: string;
  channelId: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  member?: DiscordMember;
}

interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string | null;
  read: boolean;
  created_at: string | null;
}
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import { formatDistanceToNow } from "date-fns";
import { discordSocket, SocketMessage } from "@/lib/socket/discord-socket";

type TabType = "notifications" | "servers" | "messages";

export default function DiscordPopup() {
  const { userId, userName, isLoading: userLoading } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("notifications");

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Discord state
  const [servers, setServers] = useState<DiscordServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<DiscordServer | null>(
    null,
  );
  const [selectedChannel, setSelectedChannel] = useState<DiscordChannel | null>(
    null,
  );
  const [messages, setMessages] = useState<DiscordMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);

  // Loading states
  const [loadingServers, setLoadingServers] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for custom event to open Discord popup
  useEffect(() => {
    const handleOpenDiscord = () => setIsOpen(true);
    window.addEventListener("openDiscord", handleOpenDiscord);
    return () => window.removeEventListener("openDiscord", handleOpenDiscord);
  }, []);

  // Connect to socket when user is available
  useEffect(() => {
    if (userId && isOpen) {
      discordSocket
        .connect(userId)
        .then(() => {
          setSocketConnected(true);
          console.log("[DiscordPopup] Socket connected");
        })
        .catch((err) => {
          console.warn(
            "[DiscordPopup] Socket connection failed, using REST fallback:",
            err,
          );
          setSocketConnected(false);
        });
    }

    return () => {
      // Don't disconnect on unmount - let the provider handle it
    };
  }, [userId, isOpen]);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!socketConnected) return;

    const unsubscribe = discordSocket.onMessage((message: SocketMessage) => {
      // Only add if for current channel
      if (selectedChannel && message.channelId === selectedChannel.id) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m.id === message.id)) {
            // Update existing message (for edits)
            return prev.map((m) =>
              m.id === message.id ? convertSocketMessage(message) : m,
            );
          }
          // Check for deleted message
          if (message.deleted) {
            return prev.filter((m) => m.id !== message.id);
          }
          return [...prev, convertSocketMessage(message)];
        });
      }
    });

    return unsubscribe;
  }, [socketConnected, selectedChannel]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!socketConnected || !selectedChannel) return;

    const unsubscribe = discordSocket.onTyping((data) => {
      if (data.channelId === selectedChannel.id && data.userId !== userId) {
        if (data.isTyping) {
          setTypingUsers((prev) =>
            prev.includes(data.userName) ? prev : [...prev, data.userName],
          );
        } else {
          setTypingUsers((prev) =>
            prev.filter((name) => name !== data.userName),
          );
        }
      }
    });

    return unsubscribe;
  }, [socketConnected, selectedChannel, userId]);

  // Join channel via socket when selected
  useEffect(() => {
    if (socketConnected && selectedChannel) {
      discordSocket.joinChannel(selectedChannel.id).catch(console.warn);
    }
  }, [socketConnected, selectedChannel]);

  // Helper to convert socket message to API message format
  const convertSocketMessage = (msg: SocketMessage): DiscordMessage => ({
    id: msg.id,
    content: msg.content,
    fileUrl: msg.fileUrl || null,
    fileName: msg.fileName || null,
    fileType: msg.fileType || null,
    deleted: msg.deleted,
    edited: msg.edited,
    memberId: msg.memberId,
    channelId: msg.channelId,
    createdAt: msg.createdAt || new Date().toISOString(),
    updatedAt: msg.updatedAt || null,
    member: msg.member
      ? {
          id: msg.member.id,
          role: msg.member.role as DiscordMember["role"],
          userId: msg.member.userId,
          serverId: "",
        }
      : undefined,
  });

  // Fetch notifications on open
  useEffect(() => {
    if (isOpen && userId && activeTab === "notifications") {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchNotifications only depends on userId which is already in deps
  }, [isOpen, userId, activeTab]);

  // Fetch servers on open
  useEffect(() => {
    if (isOpen && userId && activeTab === "servers") {
      fetchServers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchServers only depends on userId which is already in deps
  }, [isOpen, userId, activeTab]);

  // Fetch messages when channel is selected
  useEffect(() => {
    if (selectedChannel && memberId) {
      fetchMessages(selectedChannel.id);
    }
  }, [selectedChannel, memberId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const response = await fetch("/api/notifications", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const notifs = (data.notifications || []).map((n: any) => ({
          id: n.id,
          type: n.type || "status",
          title: n.title,
          message: n.body || n.message || null,
          read: n.read || false,
          created_at: n.createdAt || n.created_at || null,
        }));
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n: NotificationData) => !n.read).length);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  };

  const fetchServers = async () => {
    if (!userId) return;
    setLoadingServers(true);
    try {
      const response = await fetch(`/api/discord/servers?userId=${userId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const result = await response.json();
        let serverList = result.data || [];

        // Auto-setup: create a default server if user has none
        if (serverList.length === 0) {
          const setupResponse = await fetch("/api/discord/setup", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });

          if (setupResponse.ok) {
            // Re-fetch servers after setup
            const refetchResponse = await fetch(
              `/api/discord/servers?userId=${userId}`,
              { credentials: "include" },
            );
            if (refetchResponse.ok) {
              const refetchResult = await refetchResponse.json();
              serverList = refetchResult.data || [];
            }
          }
        }

        setServers(serverList);
        // Find member ID for current user in first server
        if (serverList.length > 0) {
          const member = serverList[0].members.find(
            (m: DiscordMember) => m.userId === userId,
          );
          if (member) setMemberId(member.id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch servers:", error);
    } finally {
      setLoadingServers(false);
    }
  };

  const fetchMessages = async (channelId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(
        `/api/discord/channels/${channelId}/messages?limit=50`,
        { credentials: "include" },
      );
      if (response.ok) {
        const result = await response.json();
        setMessages((result.data?.messages || []).reverse());
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedChannel || !memberId) return;

    setSendingMessage(true);
    const content = messageInput.trim();
    setMessageInput(""); // Clear immediately for better UX

    // Stop typing indicator
    if (socketConnected) {
      discordSocket.stopTyping({
        channelId: selectedChannel.id,
        userName: userName || "User",
      });
    }

    try {
      // Try socket first if connected
      if (socketConnected) {
        const result = await discordSocket.sendMessage({
          content,
          channelId: selectedChannel.id,
          memberId,
        });

        if (result.success && result.message) {
          // Message will arrive via subscription, but add optimistically
          setMessages((prev) => {
            if (prev.some((m) => m.id === result.message!.id)) return prev;
            return [...prev, convertSocketMessage(result.message!)];
          });

          // Fire-and-forget: create notifications for other server members
          // (Socket.IO path doesn't create notifications, REST fallback does)
          if (userId) {
            fetch("/api/discord/messages/notify", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                channelId: selectedChannel.id,
                senderUserId: userId,
                content,
              }),
            }).catch(() => {}); // Best-effort
          }
          return;
        }
      }

      // Fallback to REST API
      const restResponse = await fetch("/api/discord/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          memberId,
          channelId: selectedChannel.id,
        }),
      });

      if (restResponse.ok) {
        const result = await restResponse.json();
        if (result.data) {
          setMessages((prev) => [...prev, result.data]);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setMessageInput(content); // Restore on error
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (!socketConnected || !selectedChannel) return;

    discordSocket.startTyping({
      channelId: selectedChannel.id,
      userName: userName || "User",
    });

    // Auto-stop after 3 seconds of no typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      if (selectedChannel) {
        discordSocket.stopTyping({
          channelId: selectedChannel.id,
          userName: userName || "User",
        });
      }
    }, 3000);
  };

  const markNotificationRead = async (id: string) => {
    if (!userId) return;
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const formatTime = (dateStr: string | null | undefined) => {
    if (!dateStr) return "";
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return "";
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (userLoading) return null;

  return (
    <>
      {/* Popup Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 w-96 h-[32rem] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.317 4.492c-1.53-.69-3.17-1.2-4.885-1.49a.075.075 0 00-.079.036c-.21.369-.444.85-.608 1.23a18.566 18.566 0 00-5.487 0 12.36 12.36 0 00-.617-1.23A.077.077 0 008.562 3c-1.714.29-3.354.8-4.885 1.491a.07.07 0 00-.032.027C.533 9.093-.32 13.555.099 17.961a.08.08 0 00.031.055 20.03 20.03 0 005.993 2.98.078.078 0 00.084-.026c.462-.62.874-1.275 1.226-1.963.021-.04.001-.088-.041-.104a13.201 13.201 0 01-1.872-.878.075.075 0 01-.008-.125c.126-.093.252-.19.372-.287a.075.075 0 01.078-.01c3.927 1.764 8.18 1.764 12.061 0a.075.075 0 01.079.009c.12.098.245.195.372.288a.075.075 0 01-.006.125c-.598.344-1.22.635-1.873.877a.075.075 0 00-.041.105c.36.687.772 1.341 1.225 1.962a.077.077 0 00.084.028 19.963 19.963 0 006.002-2.981.076.076 0 00.032-.054c.5-5.094-.838-9.52-3.549-13.442a.06.06 0 00-.031-.028zM8.02 15.278c-1.182 0-2.157-1.069-2.157-2.38 0-1.312.956-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.956 2.38-2.157 2.38zm7.975 0c-1.183 0-2.157-1.069-2.157-2.38 0-1.312.955-2.38 2.157-2.38 1.21 0 2.176 1.077 2.157 2.38 0 1.312-.946 2.38-2.157 2.38z" />
                </svg>
              </div>
              <span className="text-white font-semibold">tCredex Connect</span>
              {socketConnected && (
                <span
                  className="w-2 h-2 bg-green-500 rounded-full"
                  title="Real-time connected"
                />
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-700 bg-gray-800/50">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors relative ${
                activeTab === "notifications"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Notifications
              {unreadCount > 0 && (
                <span className="absolute top-1 right-4 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("servers")}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === "servers"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Servers
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === "messages"
                  ? "text-indigo-400 border-b-2 border-indigo-500"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Chat
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <div className="h-full overflow-y-auto p-3 space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-400">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() =>
                        !notif.read && markNotificationRead(notif.id)
                      }
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        notif.read
                          ? "bg-gray-800/50"
                          : "bg-indigo-900/20 border border-indigo-800/50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${notif.read ? "bg-gray-600" : "bg-indigo-500"}`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm font-medium ${notif.read ? "text-gray-400" : "text-white"}`}
                          >
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-600 mt-1">
                            {formatTime(notif.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Servers Tab */}
            {activeTab === "servers" && (
              <div className="h-full flex">
                {/* Server List */}
                <div className="w-16 bg-gray-800/50 border-r border-gray-700 p-2 space-y-2 overflow-y-auto">
                  {loadingServers ? (
                    <div className="flex justify-center py-4">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : servers.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-[10px] text-gray-500">No servers</p>
                    </div>
                  ) : (
                    servers.map((server) => (
                      <button
                        key={server.id}
                        onClick={() => {
                          setSelectedServer(server);
                          const member = server.members.find(
                            (m) => m.userId === userId,
                          );
                          if (member) setMemberId(member.id);
                          if (server.channels.length > 0) {
                            setSelectedChannel(
                              server.channels.find((c) => c.type === "TEXT") ||
                                server.channels[0],
                            );
                          }
                        }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                          selectedServer?.id === server.id
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                        }`}
                        title={server.name}
                      >
                        {server.imageUrl ? (
                          <img
                            src={server.imageUrl}
                            alt={server.name}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          server.name.substring(0, 2).toUpperCase()
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Channel/Content Area */}
                <div className="flex-1 flex flex-col">
                  {selectedServer ? (
                    <>
                      {/* Server Name */}
                      <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/30">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {selectedServer.name}
                        </h3>
                      </div>

                      {/* Channels */}
                      <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {selectedServer.channels
                          .filter((c) => c.type === "TEXT")
                          .map((channel) => (
                            <button
                              key={channel.id}
                              onClick={() => setSelectedChannel(channel)}
                              className={`w-full px-3 py-1.5 rounded-lg text-left text-sm transition-colors flex items-center gap-2 ${
                                selectedChannel?.id === channel.id
                                  ? "bg-indigo-600/20 text-indigo-400"
                                  : "text-gray-400 hover:bg-gray-700 hover:text-gray-300"
                              }`}
                            >
                              <span className="text-gray-500">#</span>
                              {channel.name}
                            </button>
                          ))}

                        {/* Voice/Video Channels */}
                        {selectedServer.channels.filter(
                          (c) => c.type === "AUDIO" || c.type === "VIDEO",
                        ).length > 0 && (
                          <>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider px-3 pt-2">
                              Voice Channels
                            </div>
                            {selectedServer.channels
                              .filter(
                                (c) => c.type === "AUDIO" || c.type === "VIDEO",
                              )
                              .map((channel) => (
                                <button
                                  key={channel.id}
                                  onClick={() => {
                                    // Open call in a new window for the best experience
                                    const dealId =
                                      selectedServer.dealId || "general";
                                    const isVideo = channel.type === "VIDEO";
                                    window.open(
                                      `/closing-room/${dealId}/call?room=${channel.id}&video=${isVideo}`,
                                      "tcredex-call",
                                      "width=900,height=700,menubar=no,toolbar=no,location=no,status=no",
                                    );
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg text-left text-sm text-gray-400 hover:bg-green-700/30 hover:text-green-400 transition-colors flex items-center gap-2 group"
                                >
                                  <svg
                                    className="w-4 h-4 text-gray-500 group-hover:text-green-400"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    {channel.type === "VIDEO" ? (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                      />
                                    ) : (
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                                      />
                                    )}
                                  </svg>
                                  {channel.name}
                                  <span className="ml-auto text-[10px] text-gray-600 group-hover:text-green-400">
                                    Join
                                  </span>
                                </button>
                              ))}
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-sm text-gray-500">Select a server</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === "messages" && (
              <div className="h-full flex flex-col">
                {selectedChannel ? (
                  <>
                    {/* Channel Header */}
                    <div className="px-3 py-2 border-b border-gray-700 bg-gray-800/30 flex items-center gap-2">
                      <span className="text-gray-500">#</span>
                      <span className="text-sm font-medium text-white">
                        {selectedChannel.name}
                      </span>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-3">
                      {loadingMessages ? (
                        <div className="flex justify-center py-8">
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-gray-500">
                            No messages yet. Start the conversation!
                          </p>
                        </div>
                      ) : (
                        messages.map((msg) => (
                          <div key={msg.id} className="flex items-start gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-xs text-white font-medium">
                                {msg.member?.userId === userId ? "Me" : "U"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-medium text-white">
                                  {msg.member?.userId === userId
                                    ? userName || "You"
                                    : "User"}
                                </span>
                                <span className="text-[10px] text-gray-500">
                                  {formatTime(msg.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300 break-words">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Typing Indicator */}
                    {typingUsers.length > 0 && (
                      <div className="px-3 py-1 text-xs text-gray-400 flex items-center gap-1">
                        <span className="flex gap-0.5">
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          />
                        </span>
                        <span>
                          {typingUsers.length === 1
                            ? `${typingUsers[0]} is typing...`
                            : typingUsers.length === 2
                              ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
                              : `${typingUsers.length} people are typing...`}
                        </span>
                      </div>
                    )}

                    {/* Input */}
                    <div className="p-3 border-t border-gray-700">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => {
                            setMessageInput(e.target.value);
                            handleTyping();
                          }}
                          onKeyPress={handleKeyPress}
                          placeholder={`Message #${selectedChannel.name}`}
                          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                          disabled={sendingMessage}
                        />
                        <button
                          onClick={sendMessage}
                          disabled={!messageInput.trim() || sendingMessage}
                          className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white rounded-lg transition-colors"
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
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-sm text-gray-500 mb-2">
                        Select a channel to start chatting
                      </p>
                      <button
                        onClick={() => setActiveTab("servers")}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Browse Servers
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
