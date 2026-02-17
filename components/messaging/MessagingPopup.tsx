"use client";

import { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "@/lib/auth";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderOrg: string;
  content: string;
  attachments?: unknown[];
  createdAt: string;
  isOwn: boolean;
}

interface Conversation {
  id: string;
  type: "team" | "cde" | "investor";
  name: string;
  participants: Array<{
    id: string;
    name: string;
    organization: string;
    role: string;
  }>;
  lastMessage?: Message;
  unreadCount: number;
  dealContext?: {
    dealId: string;
    dealName: string;
  };
}

interface Contact {
  id: string;
  name: string;
  organization: string;
  role: string;
  email: string;
  isSelected?: boolean;
  dealContext?: {
    dealId: string;
    dealName: string;
    interestLevel: "high" | "medium" | "low";
  };
}

interface MessagingPopupProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: "team" | "cde" | "investor" | "sponsor";
}

export default function MessagingPopup({
  isOpen,
  onClose,
  initialCategory,
}: MessagingPopupProps) {
  const { user: _user, organizationId, orgType } = useCurrentUser();
  const [activeCategory, setActiveCategory] = useState<
    "team" | "cde" | "investor" | "sponsor"
  >(initialCategory || "team");
  const [view, setView] = useState<"categories" | "contacts" | "conversation">(
    "categories",
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<Contact[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Category configurations based on user role
  const getCategoryConfig = () => {
    const baseCategories = {
      team: {
        name: "Team Messages",
        description: "Internal team coordination",
        icon: "👥",
      },
    };

    if (orgType === "sponsor") {
      return {
        ...baseCategories,
        cde: {
          name: "CDE Messages",
          description: "CDEs interested in your deals",
          icon: "🏛️",
        },
        investor: {
          name: "Investor Messages",
          description: "Investors interested in your deals",
          icon: "💰",
        },
      };
    } else if (orgType === "cde") {
      return {
        ...baseCategories,
        sponsor: {
          name: "Sponsor Messages",
          description: "Sponsors you're working with",
          icon: "🏗️",
        },
        investor: {
          name: "Investor Messages",
          description: "Investors for deal syndication",
          icon: "💰",
        },
      };
    } else if (orgType === "investor") {
      return {
        ...baseCategories,
        sponsor: {
          name: "Sponsor Messages",
          description: "Direct sponsor relationships",
          icon: "🏗️",
        },
        cde: {
          name: "CDE Messages",
          description: "CDE partnerships",
          icon: "🏛️",
        },
      };
    }

    return baseCategories;
  };

  const categoryConfig = getCategoryConfig();

  // Load conversations for selected category
  useEffect(() => {
    if (isOpen && view === "categories") {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadConversations depends on activeCategory and organizationId which are already in deps
  }, [isOpen, activeCategory, view]);

  // Load contacts when viewing contacts
  useEffect(() => {
    if (view === "contacts") {
      loadContacts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadContacts depends on activeCategory, organizationId, and orgType which are already in deps or stable
  }, [view, activeCategory]);

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation);
    }
  }, [activeConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/conversations?category=${activeCategory}&organizationId=${organizationId}`,
      );
      const data = await response.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      setLoading(true);
      let endpoint = "";

      if (activeCategory === "team") {
        endpoint = `/api/contacts/team?organizationId=${organizationId}`;
      } else if (activeCategory === "cde" && orgType === "sponsor") {
        endpoint = `/api/contacts/interested-cdes?organizationId=${organizationId}`;
      } else if (
        activeCategory === "investor" &&
        (orgType === "sponsor" || orgType === "cde")
      ) {
        endpoint = `/api/contacts/interested-investors?organizationId=${organizationId}`;
      } else if (
        activeCategory === "sponsor" &&
        (orgType === "cde" || orgType === "investor")
      ) {
        endpoint = `/api/contacts/sponsors?organizationId=${organizationId}`;
      }

      const response = await fetch(endpoint);
      const data = await response.json();
      const contactList = Array.isArray(data) ? data : [];
      setContacts(contactList.map((c) => ({ ...c, isSelected: false })));
    } catch (error) {
      console.error("Failed to load contacts:", error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/messages/conversation/${conversationId}`,
      );
      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    }
  };

  const startConversation = async () => {
    if (selectedContacts.length === 0) return;

    try {
      setSending(true);
      const response = await fetch("/api/conversations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeCategory,
          participants: selectedContacts.map((c) => c.id),
          organizationId,
        }),
      });

      if (response.ok) {
        const conversation = await response.json();
        setActiveConversation(conversation.id);
        setView("conversation");
        setSelectedContacts([]);
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    } finally {
      setSending(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation,
          content: newMessage.trim(),
        }),
      });

      if (response.ok) {
        const sentMessage = await response.json();
        setMessages((prev) => [...prev, sentMessage]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  const toggleContactSelection = (contactId: string) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, isSelected: !c.isSelected } : c,
      ),
    );

    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      if (selectedContacts.find((c) => c.id === contactId)) {
        setSelectedContacts((prev) => prev.filter((c) => c.id !== contactId));
      } else {
        setSelectedContacts((prev) => [...prev, contact]);
      }
    }
  };

  const selectAllContacts = () => {
    const allSelected = contacts.every((c) => c.isSelected);
    setContacts((prev) =>
      prev.map((c) => ({ ...c, isSelected: !allSelected })),
    );
    setSelectedContacts(allSelected ? [] : [...contacts]);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 24) {
      return date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-gray-900 rounded-xl w-full max-w-5xl h-[700px] mx-4 border border-gray-700 flex overflow-hidden">
        {/* Header */}
        <div className="w-full flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-white">Messages</h3>

              {view !== "categories" && (
                <button
                  onClick={() => {
                    if (view === "conversation") {
                      setView("categories");
                      setActiveConversation(null);
                    } else if (view === "contacts") {
                      setView("categories");
                    }
                  }}
                  className="text-gray-400 hover:text-white flex items-center gap-1"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
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

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {view === "categories" && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setActiveCategory(key as typeof activeCategory);
                        setView("categories");
                        loadConversations();
                      }}
                      className="p-6 bg-gray-800/50 rounded-xl border border-gray-700 hover:border-indigo-500/50 transition-colors text-left"
                    >
                      <div className="text-3xl mb-3">{config.icon}</div>
                      <h4 className="font-semibold text-white mb-2">
                        {config.name}
                      </h4>
                      <p className="text-sm text-gray-400">
                        {config.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Recent Conversations */}
                {conversations.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-white">
                        Recent Conversations
                      </h4>
                      <button
                        onClick={() => setView("contacts")}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        Start New →
                      </button>
                    </div>

                    <div className="space-y-2">
                      {conversations.slice(0, 5).map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => {
                            setActiveConversation(conversation.id);
                            setView("conversation");
                          }}
                          className="p-4 bg-gray-800/50 rounded-lg border border-gray-700 hover:border-indigo-500/50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-white text-sm">
                                {conversation.name}
                              </h5>
                              <p className="text-xs text-gray-400 mt-1">
                                {conversation.participants
                                  .map((p) => p.name)
                                  .join(", ")}
                              </p>
                              {conversation.lastMessage && (
                                <p className="text-xs text-gray-500 mt-1 truncate">
                                  {conversation.lastMessage.content}
                                </p>
                              )}
                            </div>
                            {conversation.unreadCount > 0 && (
                              <span className="bg-indigo-600 text-white text-xs rounded-full px-2 py-0.5">
                                {conversation.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {conversations.length === 0 && !loading && (
                  <div className="mt-8 text-center">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-300 mb-2">
                      No conversations yet
                    </h4>
                    <p className="text-sm text-gray-500 mb-4">
                      Start your first conversation
                    </p>
                    <button
                      onClick={() => setView("contacts")}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
                    >
                      Start Conversation
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === "contacts" && (
              <div className="flex flex-col h-full">
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-white">
                      {
                        (categoryConfig as Record<string, { name: string }>)[
                          activeCategory
                        ]?.name
                      }{" "}
                      - Select Contacts
                    </h4>
                    {activeCategory === "team" && contacts.length > 1 && (
                      <button
                        onClick={selectAllContacts}
                        className="text-sm text-indigo-400 hover:text-indigo-300"
                      >
                        {contacts.every((c) => c.isSelected)
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    )}
                  </div>

                  {selectedContacts.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm text-gray-400">Selected:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedContacts.map((contact) => (
                          <span
                            key={contact.id}
                            className="px-2 py-1 bg-indigo-600 text-white text-xs rounded"
                          >
                            {contact.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  {loading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : contacts.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg
                          className="w-6 h-6 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                      </div>
                      <p className="text-gray-500">No contacts available</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => toggleContactSelection(contact.id)}
                          className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                            contact.isSelected
                              ? "bg-indigo-900/30 border-indigo-500"
                              : "bg-gray-800/50 border-gray-700 hover:border-gray-600"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                contact.isSelected
                                  ? "bg-indigo-600 border-indigo-600"
                                  : "border-gray-600"
                              }`}
                            >
                              {contact.isSelected && (
                                <svg
                                  className="w-3 h-3 text-white"
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
                              )}
                            </div>

                            <div className="flex-1">
                              <h5 className="font-medium text-white">
                                {contact.name}
                              </h5>
                              <p className="text-sm text-gray-400">
                                {contact.organization}
                              </p>
                              {contact.dealContext && (
                                <p className="text-xs text-indigo-400 mt-1">
                                  Interested in: {contact.dealContext.dealName}
                                </p>
                              )}
                            </div>

                            <div className="text-right">
                              <span className="text-xs text-gray-500">
                                {contact.role}
                              </span>
                              {contact.dealContext && (
                                <div
                                  className={`text-xs px-2 py-0.5 rounded mt-1 ${
                                    contact.dealContext.interestLevel === "high"
                                      ? "bg-green-900/50 text-green-400"
                                      : contact.dealContext.interestLevel ===
                                          "medium"
                                        ? "bg-amber-900/50 text-amber-400"
                                        : "bg-gray-900/50 text-gray-400"
                                  }`}
                                >
                                  {contact.dealContext.interestLevel} interest
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selectedContacts.length > 0 && (
                  <div className="p-4 border-t border-gray-700">
                    <button
                      onClick={startConversation}
                      disabled={sending}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-indigo-800 flex items-center justify-center gap-2"
                    >
                      {sending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Starting...
                        </>
                      ) : (
                        <>
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
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          Start Conversation ({selectedContacts.length})
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {view === "conversation" && activeConversation && (
              <div className="flex flex-col h-full">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[70%] ${message.isOwn ? "order-2" : "order-1"}`}
                      >
                        {!message.isOwn && (
                          <div className="text-xs text-gray-500 mb-1">
                            {message.senderName} • {message.senderOrg}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            message.isOwn
                              ? "bg-indigo-600 text-white rounded-br-md"
                              : "bg-gray-800 text-gray-200 rounded-bl-md"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${message.isOwn ? "text-indigo-200" : "text-gray-500"}`}
                          >
                            {formatTime(message.createdAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      {sending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
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
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
