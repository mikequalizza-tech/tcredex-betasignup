"use client";

import { useState, useEffect } from "react";
import { useCurrentUser } from '@/lib/auth';
import { createClient } from "@/lib/supabase/client";
import { useMessageHub } from "@/contexts/message-hub-context";
import {
  MessageCircle,
  X,
  Search,
  Plus,
  Phone,
  Video,
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  ChevronLeft,
  Send,
  Paperclip,
  Check,
  CheckCheck,
} from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  type: "direct" | "team" | "deal";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participants: {
    id: string;
    name: string;
    avatar?: string;
    role?: string;
  }[];
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  createdAt: string;
  isRead: boolean;
}

const categoryIcons = {
  all: MessageCircle,
  team: Users,
  cdes: Briefcase,
  investors: TrendingUp,
  sponsors: Building2,
};

export function MessageHub() {
  const { user } = useCurrentUser();
  const { isOpen, closeMessages, setUnreadCount } = useMessageHub();
  const [view, setView] = useState<"list" | "chat">("list");
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch conversations
  useEffect(() => {
    if (!user?.id || !isOpen) return;

    const fetchConversations = async () => {
      try {
        const response = await fetch("/api/messages/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data.conversations || []);
          const totalUnread = data.conversations?.reduce((sum: number, c: Conversation) => sum + c.unreadCount, 0) || 0;
          setUnreadCount(totalUnread);
        }
      } catch (err) {
        console.error("Failed to fetch conversations:", err);
      }
    };

    fetchConversations();
  }, [user?.id, isOpen, setUnreadCount]);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/messages?conversationId=${selectedConversation.id}`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Set up real-time subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        setNewMessage("");
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleSelectConversation = (conv: Conversation) => {
    setSelectedConversation(conv);
    setView("chat");
  };

  const handleBack = () => {
    setView("list");
    setSelectedConversation(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter((conv) => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || conv.type === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (!user || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={closeMessages}
      />

          {/* Panel */}
          <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/95 backdrop-blur">
              {view === "chat" && selectedConversation ? (
                <>
                  <button
                    onClick={handleBack}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-400" />
                  </button>
                  <div className="flex-1 min-w-0 ml-2">
                    <h3 className="text-sm font-semibold text-white truncate">
                      {selectedConversation.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {selectedConversation.participants.length} participant
                      {selectedConversation.participants.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Voice Call">
                      <Phone className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Video Call">
                      <Video className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-white">Messages</h2>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="New Conversation">
                      <Plus className="h-5 w-5 text-gray-400" />
                    </button>
                    <button
                      onClick={closeMessages}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-400" />
                    </button>
                  </div>
                </>
              )}
            </div>

            {view === "list" ? (
              <>
                {/* Search */}
                <div className="px-4 py-3 border-b border-gray-800">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 overflow-x-auto">
                  {Object.entries(categoryIcons).map(([key, Icon]) => (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                        activeCategory === key
                          ? "bg-indigo-600 text-white"
                          : "text-gray-400 hover:bg-gray-800 hover:text-white"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <MessageCircle className="h-12 w-12 text-gray-700 mb-3" />
                      <p className="text-gray-400 text-sm">No conversations yet</p>
                      <p className="text-gray-600 text-xs mt-1">Start a new conversation to begin messaging</p>
                    </div>
                  ) : (
                    filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => handleSelectConversation(conv)}
                        className="w-full flex items-start gap-3 p-4 hover:bg-gray-800/50 border-b border-gray-800/50 transition-colors text-left"
                      >
                        {/* Avatar */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                            {conv.title.charAt(0).toUpperCase()}
                          </div>
                          {conv.unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium text-white truncate">
                              {conv.title}
                            </span>
                            {conv.lastMessageAt && (
                              <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                                {formatTime(conv.lastMessageAt)}
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageCircle className="h-10 w-10 text-gray-700 mb-2" />
                      <p className="text-gray-500 text-sm">No messages yet</p>
                      <p className="text-gray-600 text-xs">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                              isOwn
                                ? "bg-indigo-600 text-white rounded-br-md"
                                : "bg-gray-800 text-white rounded-bl-md"
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs text-indigo-400 font-medium mb-1">
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm">{msg.content}</p>
                            <div className={`flex items-center gap-1 mt-1 ${isOwn ? "justify-end" : ""}`}>
                              <span className="text-[10px] text-gray-400">
                                {formatTime(msg.createdAt)}
                              </span>
                              {isOwn && (
                                msg.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-indigo-300" />
                                ) : (
                                  <Check className="h-3 w-3 text-gray-400" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-800 bg-gray-900/95">
                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors" title="Attach File">
                      <Paperclip className="h-5 w-5 text-gray-400" />
                    </button>
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-full text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim()}
                      className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
                    >
                      <Send className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </>
            )}
      </div>
    </>
  );
}
