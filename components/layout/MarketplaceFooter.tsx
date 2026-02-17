"use client";

import React, { useState } from "react";
import { useCurrentUser } from "@/lib/auth";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { MessageCircle } from "lucide-react";
import DiscordPopup from "@/components/discord/DiscordPopup";

interface MarketplaceFooterProps {
  onChatSubmit?: (message: string) => void;
  onOpenMessages?: () => void;
  unreadCount?: number;
}

export default function MarketplaceFooter({
  onChatSubmit,
  onOpenMessages,
  unreadCount = 0,
}: MarketplaceFooterProps) {
  const { user } = useCurrentUser();
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<
    { role: "user" | "assistant"; content: string }[]
  >([
    {
      role: "assistant",
      content:
        "I'm ChatTC, your tax credit marketplace assistant. I can help you find projects, filter by program type, analyze pricing, or answer questions about NMTC, HTC, LIHTC, and OZ credits. What are you looking for?",
    },
  ]);
  const [isExpanded, setIsExpanded] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || isLoading) return;

    const userMsg = chatMessage.trim();
    setChatMessage("");

    // Add user message
    setChatHistory((prev) => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      // Call the real ChatTC API
      const response = await fetch("/api/chat", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatHistory, { role: "user", content: userMsg }],
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const contentType = response.headers.get("content-type");

      if (contentType?.includes("text/event-stream")) {
        // Handle SSE streaming response
        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        const decoder = new TextDecoder();
        let assistantResponse = "";

        // Add empty assistant message that we'll update as text streams in
        setChatHistory((prev) => [...prev, { role: "assistant", content: "" }]);
        setIsLoading(false);

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              if (json.content) {
                assistantResponse += json.content;
                setChatHistory((prev) => {
                  const updated = [...prev];
                  if (
                    updated.length > 0 &&
                    updated[updated.length - 1].role === "assistant"
                  ) {
                    updated[updated.length - 1] = {
                      ...updated[updated.length - 1],
                      content: assistantResponse,
                    };
                  }
                  return updated;
                });
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } else {
        // Non-streaming fallback
        const data = await response.json();
        setChatHistory((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm having trouble connecting. For platform support: support@tcredex.com. For deal advisory: deals@americanimpactventures.com",
        },
      ]);
    } finally {
      setIsLoading(false);
    }

    if (onChatSubmit) {
      onChatSubmit(userMsg);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 text-gray-100 z-40 backdrop-blur">
      {/* Expanded Chat Panel */}
      {isExpanded && (
        <div className="border-b border-gray-800 bg-gray-900/95">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">TC</span>
                </div>
                <span className="font-medium text-white">ChatTC</span>
                <span className="text-xs text-gray-400">AI Assistant</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-300 p-1"
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
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
            <div className="h-64 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-lg ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-800 border border-gray-700 text-gray-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 border border-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></span>
                      <span
                        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left - Logo & Links */}
        <div className="flex items-center gap-6">
          <Logo size="sm" />
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link href="/about" className="text-gray-300 hover:text-white">
              About
            </Link>
            <Link href="/features" className="text-gray-300 hover:text-white">
              Features
            </Link>
            <Link href="/contact" className="text-gray-300 hover:text-white">
              Contact
            </Link>
            <Link href="/support" className="text-gray-300 hover:text-white">
              Support
            </Link>
          </nav>
        </div>

        {/* Center - Chat Input */}
        <form onSubmit={handleSubmit} className="flex-1 max-w-xl mx-4">
          <div className="relative flex items-center">
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="absolute left-3 text-gray-400 hover:text-indigo-400"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">TC</span>
              </div>
            </button>
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onFocus={() => setIsExpanded(true)}
              placeholder="Ask ChatTC anything..."
              className="w-full pl-12 pr-24 py-2 border border-gray-700 rounded-full bg-gray-800 text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
            <button
              type="submit"
              disabled={isLoading || !chatMessage.trim()}
              className="absolute right-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-sm font-medium hover:bg-indigo-500 disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </form>

        {/* Right - Messages Button & Copyright */}
        <div className="flex items-center gap-4">
          {user && (
            <button
              onClick={() => {
                window.dispatchEvent(new Event("openDiscord"));
                onOpenMessages?.();
              }}
              className="relative flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Messages</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}
          <span className="hidden lg:inline text-sm text-gray-400">
            © 2025 tCredex
          </span>
        </div>
      </div>

      {/* Discord Popup (notifications, servers, chat) */}
      <DiscordPopup />
    </footer>
  );
}
