'use client';

/**
 * Discord Socket Provider
 * Provides socket connection context to React components
 */

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { discordSocket, SocketMessage, TypingUser, PresenceUpdate } from './discord-socket';

// =============================================================================
// CONTEXT TYPES
// =============================================================================

interface DiscordSocketContextValue {
  isConnected: boolean;
  connect: (userId: string) => Promise<void>;
  disconnect: () => void;

  // Channel operations
  joinChannel: (channelId: string) => Promise<void>;
  leaveChannel: (channelId: string) => Promise<void>;
  sendMessage: (data: {
    content: string;
    channelId: string;
    memberId: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => Promise<SocketMessage | undefined>;

  // DM operations
  joinConversation: (conversationId: string) => Promise<void>;
  sendDirectMessage: (data: {
    content: string;
    conversationId: string;
    memberId: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => Promise<SocketMessage | undefined>;

  // Typing indicators
  startTyping: (data: { channelId?: string; conversationId?: string; userName: string }) => void;
  stopTyping: (data: { channelId?: string; conversationId?: string; userName: string }) => void;

  // Presence
  onlineUsers: string[];
  updatePresence: (status: 'online' | 'away' | 'offline') => void;

  // Event subscriptions (for components)
  onMessage: (handler: (message: SocketMessage) => void) => () => void;
  onDirectMessage: (handler: (message: SocketMessage) => void) => () => void;
  onTyping: (handler: (data: TypingUser & { isTyping: boolean }) => void) => () => void;
}

// =============================================================================
// CONTEXT
// =============================================================================

const DiscordSocketContext = createContext<DiscordSocketContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface DiscordSocketProviderProps {
  children: ReactNode;
  userId?: string;
  autoConnect?: boolean;
}

export function DiscordSocketProvider({
  children,
  userId,
  autoConnect = true,
}: DiscordSocketProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  // Connect on mount if userId is provided
  useEffect(() => {
    if (autoConnect && userId) {
      discordSocket.connect(userId)
        .then(() => {
          setIsConnected(true);
          // Fetch initial online users
          discordSocket.getOnlineUsers().then(result => {
            if (result.success) {
              setOnlineUsers(result.users);
            }
          });
        })
        .catch((err) => {
          console.error('[DiscordSocketProvider] Failed to connect:', err);
        });
    }

    return () => {
      discordSocket.disconnect();
      setIsConnected(false);
    };
  }, [userId, autoConnect]);

  // Subscribe to presence updates
  useEffect(() => {
    const unsubscribe = discordSocket.onPresence((data: PresenceUpdate) => {
      setOnlineUsers(prev => {
        if (data.status === 'online') {
          return prev.includes(data.userId) ? prev : [...prev, data.userId];
        } else {
          return prev.filter(id => id !== data.userId);
        }
      });
    });

    return unsubscribe;
  }, []);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const connect = useCallback(async (userId: string) => {
    await discordSocket.connect(userId);
    setIsConnected(true);
  }, []);

  const disconnect = useCallback(() => {
    discordSocket.disconnect();
    setIsConnected(false);
  }, []);

  const joinChannel = useCallback(async (channelId: string) => {
    await discordSocket.joinChannel(channelId);
  }, []);

  const leaveChannel = useCallback(async (channelId: string) => {
    await discordSocket.leaveChannel(channelId);
  }, []);

  const sendMessage = useCallback(async (data: {
    content: string;
    channelId: string;
    memberId: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => {
    const result = await discordSocket.sendMessage(data);
    return result.message;
  }, []);

  const joinConversation = useCallback(async (conversationId: string) => {
    await discordSocket.joinConversation(conversationId);
  }, []);

  const sendDirectMessage = useCallback(async (data: {
    content: string;
    conversationId: string;
    memberId: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }) => {
    const result = await discordSocket.sendDirectMessage(data);
    return result.message;
  }, []);

  const startTyping = useCallback((data: { channelId?: string; conversationId?: string; userName: string }) => {
    discordSocket.startTyping(data);
  }, []);

  const stopTyping = useCallback((data: { channelId?: string; conversationId?: string; userName: string }) => {
    discordSocket.stopTyping(data);
  }, []);

  const updatePresence = useCallback((status: 'online' | 'away' | 'offline') => {
    discordSocket.updatePresence(status);
  }, []);

  const onMessage = useCallback((handler: (message: SocketMessage) => void) => {
    return discordSocket.onMessage(handler);
  }, []);

  const onDirectMessage = useCallback((handler: (message: SocketMessage) => void) => {
    return discordSocket.onDirectMessage(handler);
  }, []);

  const onTyping = useCallback((handler: (data: TypingUser & { isTyping: boolean }) => void) => {
    return discordSocket.onTyping(handler);
  }, []);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const value: DiscordSocketContextValue = {
    isConnected,
    connect,
    disconnect,
    joinChannel,
    leaveChannel,
    sendMessage,
    joinConversation,
    sendDirectMessage,
    startTyping,
    stopTyping,
    onlineUsers,
    updatePresence,
    onMessage,
    onDirectMessage,
    onTyping,
  };

  return (
    <DiscordSocketContext.Provider value={value}>
      {children}
    </DiscordSocketContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useDiscordSocketContext() {
  const context = useContext(DiscordSocketContext);
  if (!context) {
    throw new Error('useDiscordSocketContext must be used within a DiscordSocketProvider');
  }
  return context;
}

// Re-export for convenience
export { discordSocket } from './discord-socket';
export type { SocketMessage, TypingUser, PresenceUpdate } from './discord-socket';
