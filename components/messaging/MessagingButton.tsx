"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useCurrentUser } from "@/lib/auth";
import { usePathname } from "next/navigation";
import MessagingPopup from "./MessagingPopup";

interface MessagingButtonProps {
  dealId?: string;
  className?: string;
}

export default function MessagingButton({
  dealId: _dealId,
  className = "",
}: MessagingButtonProps) {
  const { organizationId } = useCurrentUser();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const hasFetchedRef = useRef(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Don't load messaging on intake page - it's not needed there
  const shouldLoadMessaging = pathname !== "/intake" && !!organizationId;

  // Memoized unread count loader - NO /api/deals call, just check conversations API directly
  const loadUnreadCount = useCallback(async () => {
    if (!organizationId) {
      setUnreadCount(0);
      return;
    }

    try {
      // Use the conversations API directly - don't fetch deals
      const response = await fetch(
        `/api/messages/conversations?organizationId=${organizationId}&category=team`,
      );

      if (!response.ok) {
        setUnreadCount(0);
        return;
      }

      const data = await response.json();
      const conversations = data.conversations || [];

      // Sum up unread counts from all conversations

      const totalUnread = conversations.reduce(
        (sum: number, conv: any) => sum + (conv.unread_count || 0),
        0,
      );
      setUnreadCount(totalUnread);
    } catch {
      setUnreadCount(0);
    }
  }, [organizationId]);

  // Load unread count once on mount, then poll
  useEffect(() => {
    if (!shouldLoadMessaging) {
      setUnreadCount(0);
      return;
    }

    // Only fetch once on initial mount
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      loadUnreadCount();
    }

    // Poll for updates every 60 seconds (not 30 - reduce load)
    intervalRef.current = setInterval(loadUnreadCount, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [shouldLoadMessaging, loadUnreadCount]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`relative inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors ${className}`}
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
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>Messages</span>
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <MessagingPopup isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
