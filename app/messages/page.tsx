"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import {
  MessagesSidebar,
  MessagesBody,
  MessagesEmpty,
  NewConversationModal,
} from "@/components/messages";

// Types
interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_org: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

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

interface Contact {
  id: string;
  name: string;
  organization: string;
  role: string;
  org_type: string;
}

// Category configs based on role
const getCategoryConfig = (orgType: string | null) => {
  const baseCategories = {
    team: { name: "Team", icon: "users", color: "indigo" },
  };

  if (orgType === "sponsor") {
    return {
      ...baseCategories,
      cde: { name: "CDEs", icon: "building", color: "emerald" },
      investor: { name: "Investors", icon: "dollar", color: "amber" },
    };
  } else if (orgType === "cde") {
    return {
      ...baseCategories,
      sponsor: { name: "Sponsors", icon: "briefcase", color: "purple" },
      investor: { name: "Investors", icon: "dollar", color: "amber" },
    };
  } else if (orgType === "investor") {
    return {
      ...baseCategories,
      sponsor: { name: "Sponsors", icon: "briefcase", color: "purple" },
      cde: { name: "CDEs", icon: "building", color: "emerald" },
    };
  }

  // Default: show all categories when role_type is not set
  return {
    ...baseCategories,
    cde: { name: "CDEs", icon: "building", color: "emerald" },
    sponsor: { name: "Sponsors", icon: "briefcase", color: "purple" },
    investor: { name: "Investors", icon: "dollar", color: "amber" },
  };
};

export default function MessagesPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading,
    orgType,
    userName,
    orgName,
    organizationId,
    userId,
  } = useCurrentUser();

  // Defer Supabase client creation to avoid SSR issues
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null;
    return createClient();
  }, []);

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("team");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const categoryConfig = getCategoryConfig(orgType || null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const orgParam = organizationId
        ? `&organizationId=${organizationId}`
        : `&userId=${userId}`;
      const response = await fetch(
        `/api/messages/conversations?category=${activeCategory}${orgParam}`,
      );
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [activeCategory, organizationId, userId]);

  // Load messages for conversation
  const loadMessages = useCallback(
    async (conversationId: string) => {
      try {
        const response = await fetch(
          `/api/messages?conversationId=${conversationId}`,
        );
        if (response.ok) {
          const data = await response.json();
          setMessages(data.messages || []);
          // Mark as read
          await fetch(`/api/messages/read`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId, userId, organizationId }),
          });
        }
      } catch (error) {
        console.error("Failed to load messages:", error);
      }
    },
    [userId, organizationId],
  );

  // Load contacts for new conversation
  const loadContacts = useCallback(async () => {
    if (!userId) return;
    setContactsLoading(true);
    try {
      const orgParam = organizationId
        ? `&organizationId=${organizationId}`
        : "";
      const response = await fetch(
        `/api/messages/contacts?category=${activeCategory}${orgParam}`,
      );
      if (response.ok) {
        const data = await response.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error("Failed to load contacts:", error);
    } finally {
      setContactsLoading(false);
    }
  }, [activeCategory, organizationId, userId]);

  // Send message
  const sendMessage = async (content: string) => {
    if (!content.trim() || !activeConversation || sending) return;

    setSending(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversation.id,
          content: content.trim(),
          senderId: userId,
          senderName: userName,
          senderOrg: orgName,
          senderOrgId: organizationId,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSending(false);
    }
  };

  // Start new conversation
  const startConversation = async (selectedContactIds: string[]) => {
    if (selectedContactIds.length === 0) return;

    try {
      const response = await fetch("/api/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          category: activeCategory,
          participantIds: selectedContactIds,
          organizationId,
          creatorId: userId,
          creatorName: userName,
          creatorOrg: orgName,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShowNewConversation(false);
        setActiveConversation(data.conversation);
        loadConversations();
      }
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setActiveConversation(conversation);
    setSidebarOpen(false); // Close sidebar on mobile when selecting
  };

  // Handle category change
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setActiveConversation(null);
    setMessages([]);
  };

  // Effects
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin?redirect=/messages");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [loadConversations, userId]);

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation, loadMessages]);

  useEffect(() => {
    if (showNewConversation) {
      loadContacts();
    }
  }, [showNewConversation, loadContacts]);

  // Real-time subscription
  useEffect(() => {
    if (!activeConversation || !supabase) return;

    const channel = supabase
      .channel(`messages:${activeConversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeConversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.sender_id !== userId) {
            setMessages((prev) => [...prev, newMsg]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation, supabase, userId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-[calc(100dvh-64px)] overflow-hidden bg-gray-950">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <MessagesSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onSelectConversation={handleSelectConversation}
          onNewConversation={() => setShowNewConversation(true)}
          categories={categoryConfig}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
          loading={loading}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        {/* Main content */}
        {activeConversation ? (
          <MessagesBody
            conversation={activeConversation}
            messages={messages}
            currentUserId={userId || null}
            onSendMessage={sendMessage}
            sending={sending}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            sidebarOpen={sidebarOpen}
          />
        ) : (
          <MessagesEmpty
            onNewConversation={() => setShowNewConversation(true)}
          />
        )}

        {/* New Conversation Modal */}
        <NewConversationModal
          isOpen={showNewConversation}
          onClose={() => setShowNewConversation(false)}
          contacts={contacts}
          categoryName={
            categoryConfig[activeCategory as keyof typeof categoryConfig]
              ?.name || "Team"
          }
          onStartConversation={startConversation}
          loading={contactsLoading}
        />
      </div>

      {/* Minimal Footer */}
      <div className="shrink-0 h-10 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-4">
        <p className="text-xs text-gray-500">
          Messages are encrypted and secured
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <a
            href="/help/messages"
            className="hover:text-gray-400 transition-colors"
          >
            Help
          </a>
          <span>© {new Date().getFullYear()} tCredex</span>
        </div>
      </div>
    </div>
  );
}
