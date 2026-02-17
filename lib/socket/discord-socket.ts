/**
 * Discord Socket.io Client
 * Handles real-time communication with the Discord WebSocket gateway
 */

import { io, Socket } from "socket.io-client";

// =============================================================================
// TYPES
// =============================================================================

export interface SocketMessage {
  id: string;
  content: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  deleted: boolean;
  edited: boolean;
  memberId: string;
  channelId: string;
  createdAt: string | null;
  updatedAt: string | null;
  member?: {
    id: string;
    userId: string;
    role: string;
  };
}

export interface TypingUser {
  userId: string;
  userName: string;
  channelId?: string;
  conversationId?: string;
}

export interface PresenceUpdate {
  userId: string;
  status: "online" | "away" | "offline";
}

type MessageHandler = (message: SocketMessage) => void;
type TypingHandler = (data: TypingUser & { isTyping: boolean }) => void;
type PresenceHandler = (data: PresenceUpdate) => void;
type ErrorHandler = (error: unknown) => void;

// =============================================================================
// DISCORD SOCKET CLASS
// =============================================================================

class DiscordSocket {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  // Event handlers
  private messageHandlers: Set<MessageHandler> = new Set();
  private dmHandlers: Set<MessageHandler> = new Set();
  private typingHandlers: Set<TypingHandler> = new Set();
  private presenceHandlers: Set<PresenceHandler> = new Set();
  private errorHandlers: Set<ErrorHandler> = new Set();

  /**
   * Initialize the socket connection
   */
  connect(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.userId = userId;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

      this.socket = io(`${apiUrl}/discord`, {
        auth: { userId },
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      this.socket.on("connect", () => {
        console.log("[DiscordSocket] Connected");
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on("connect_error", (error) => {
        console.error("[DiscordSocket] Connection error:", error);
        this.reconnectAttempts++;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          reject(error);
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("[DiscordSocket] Disconnected:", reason);
      });

      // Set up event listeners
      this.setupEventListeners();
    });
  }

  /**
   * Disconnect the socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Set up event listeners for incoming messages
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Channel messages
    this.socket.on("message:new", (message: SocketMessage) => {
      this.messageHandlers.forEach((handler) => handler(message));
    });

    this.socket.on("message:updated", (message: SocketMessage) => {
      this.messageHandlers.forEach((handler) => handler(message));
    });

    this.socket.on("message:deleted", (data: { messageId: string }) => {
      // Create a deleted message placeholder
      const deletedMessage: SocketMessage = {
        id: data.messageId,
        content: "",
        deleted: true,
        edited: false,
        memberId: "",
        channelId: "",
        createdAt: null,
        updatedAt: null,
      };
      this.messageHandlers.forEach((handler) => handler(deletedMessage));
    });

    // Direct messages
    this.socket.on("dm:new", (message: SocketMessage) => {
      this.dmHandlers.forEach((handler) => handler(message));
    });

    this.socket.on("dm:deleted", (data: { messageId: string }) => {
      const deletedMessage: SocketMessage = {
        id: data.messageId,
        content: "",
        deleted: true,
        edited: false,
        memberId: "",
        channelId: "",
        createdAt: null,
        updatedAt: null,
      };
      this.dmHandlers.forEach((handler) => handler(deletedMessage));
    });

    // Typing indicators
    this.socket.on(
      "typing:update",
      (data: TypingUser & { isTyping: boolean }) => {
        this.typingHandlers.forEach((handler) => handler(data));
      },
    );

    // Presence updates
    this.socket.on("presence:update", (data: PresenceUpdate) => {
      this.presenceHandlers.forEach((handler) => handler(data));
    });

    // Error handling
    this.socket.on("error", (error: unknown) => {
      console.error("[DiscordSocket] Error:", error);
      this.errorHandlers.forEach((handler) => handler(error));
    });
  }

  // =============================================================================
  // CHANNEL OPERATIONS
  // =============================================================================

  /**
   * Join a channel to receive messages
   */
  async joinChannel(channelId: string): Promise<{ success: boolean }> {
    return this.emit("channel:join", { channelId, userId: this.userId });
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string): Promise<{ success: boolean }> {
    return this.emit("channel:leave", { channelId, userId: this.userId });
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(data: {
    content: string;
    channelId: string;
    memberId: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }): Promise<{ success: boolean; message?: SocketMessage }> {
    return this.emit("message:send", data);
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    content: string,
  ): Promise<{ success: boolean }> {
    return this.emit("message:edit", { messageId, content });
  }

  /**
   * Delete a message
   */
  async deleteMessage(
    messageId: string,
    channelId: string,
  ): Promise<{ success: boolean }> {
    return this.emit("message:delete", { messageId, channelId });
  }

  // =============================================================================
  // DIRECT MESSAGE OPERATIONS
  // =============================================================================

  /**
   * Join a conversation to receive DMs
   */
  async joinConversation(
    conversationId: string,
  ): Promise<{ success: boolean }> {
    return this.emit("conversation:join", {
      conversationId,
      userId: this.userId,
    });
  }

  /**
   * Send a direct message
   */
  async sendDirectMessage(data: {
    content: string;
    conversationId: string;
    memberId: string;
    fileUrl?: string;
    fileName?: string;
    fileType?: string;
  }): Promise<{ success: boolean; message?: SocketMessage }> {
    return this.emit("dm:send", data);
  }

  /**
   * Delete a direct message
   */
  async deleteDirectMessage(
    messageId: string,
    conversationId: string,
  ): Promise<{ success: boolean }> {
    return this.emit("dm:delete", { messageId, conversationId });
  }

  // =============================================================================
  // TYPING INDICATORS
  // =============================================================================

  /**
   * Send typing start indicator
   */
  startTyping(data: {
    channelId?: string;
    conversationId?: string;
    userName: string;
  }): void {
    if (!this.socket) return;
    this.socket.emit("typing:start", { ...data, userId: this.userId });
  }

  /**
   * Send typing stop indicator
   */
  stopTyping(data: {
    channelId?: string;
    conversationId?: string;
    userName: string;
  }): void {
    if (!this.socket) return;
    this.socket.emit("typing:stop", { ...data, userId: this.userId });
  }

  // =============================================================================
  // PRESENCE
  // =============================================================================

  /**
   * Update presence status
   */
  updatePresence(status: "online" | "away" | "offline"): void {
    if (!this.socket) return;
    this.socket.emit("presence:update", { userId: this.userId, status });
  }

  /**
   * Get online users
   */
  async getOnlineUsers(): Promise<{ success: boolean; users: string[] }> {
    return this.emit("presence:get-online", {});
  }

  // =============================================================================
  // EVENT SUBSCRIPTION
  // =============================================================================

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onDirectMessage(handler: MessageHandler): () => void {
    this.dmHandlers.add(handler);
    return () => this.dmHandlers.delete(handler);
  }

  onTyping(handler: TypingHandler): () => void {
    this.typingHandlers.add(handler);
    return () => this.typingHandlers.delete(handler);
  }

  onPresence(handler: PresenceHandler): () => void {
    this.presenceHandlers.add(handler);
    return () => this.presenceHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // =============================================================================
  // HELPERS
  // =============================================================================

  private emit<T>(event: string, data: Record<string, unknown>): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error("Socket not connected"));
        return;
      }

      this.socket.emit(event, data, (response: T) => {
        resolve(response);
      });
    });
  }
}

// Export singleton instance
export const discordSocket = new DiscordSocket();

// Export hook for React components
export function useDiscordSocket() {
  return discordSocket;
}
