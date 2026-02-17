"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface MessageHubContextType {
  isOpen: boolean;
  openMessages: () => void;
  closeMessages: () => void;
  toggleMessages: () => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

const MessageHubContext = createContext<MessageHubContextType | undefined>(undefined);

export function MessageHubProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const openMessages = useCallback(() => setIsOpen(true), []);
  const closeMessages = useCallback(() => setIsOpen(false), []);
  const toggleMessages = useCallback(() => setIsOpen((prev) => !prev), []);

  return (
    <MessageHubContext.Provider
      value={{
        isOpen,
        openMessages,
        closeMessages,
        toggleMessages,
        unreadCount,
        setUnreadCount,
      }}
    >
      {children}
    </MessageHubContext.Provider>
  );
}

export function useMessageHub() {
  const context = useContext(MessageHubContext);
  if (!context) {
    // Return a no-op version for pages without the provider
    return {
      isOpen: false,
      openMessages: () => {},
      closeMessages: () => {},
      toggleMessages: () => {},
      unreadCount: 0,
      setUnreadCount: () => {},
    };
  }
  return context;
}
