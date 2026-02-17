"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase for realtime subscriptions
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface UseRealtimeMessagesProps {
  roomId: string;
  queryKey: string;
}

interface Message {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_org_name: string;
  content: string;
  file_url?: string;
  deleted: boolean;
  created_at: string;
  updated_at: string;
}

export const useRealtimeMessages = ({
  roomId,
  queryKey,
}: UseRealtimeMessagesProps) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!roomId) return;

    // Subscribe to INSERT events on closing_room_messages
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "closing_room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          // Update React Query cache with new message
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryClient.setQueryData([queryKey], (oldData: any) => {
            if (!oldData?.pages) return oldData;

            // Add new message to the first page
            const newPages = [...oldData.pages];
            if (newPages[0]?.items) {
              // Check if message already exists (prevent duplicates)
              const exists = newPages[0].items.some(
                (msg: Message) => msg.id === newMessage.id,
              );
              if (!exists) {
                newPages[0] = {
                  ...newPages[0],
                  items: [...newPages[0].items, newMessage],
                };
              }
            }

            return { ...oldData, pages: newPages };
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "closing_room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const updatedMessage = payload.new as Message;

          // Update the message in cache
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryClient.setQueryData([queryKey], (oldData: any) => {
            if (!oldData?.pages) return oldData;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newPages = oldData.pages.map((page: any) => ({
              ...page,
              items: page.items?.map((msg: Message) =>
                msg.id === updatedMessage.id ? updatedMessage : msg,
              ),
            }));

            return { ...oldData, pages: newPages };
          });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "closing_room_messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const deletedId = payload.old.id;

          // Remove message from cache
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          queryClient.setQueryData([queryKey], (oldData: any) => {
            if (!oldData?.pages) return oldData;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const newPages = oldData.pages.map((page: any) => ({
              ...page,
              items: page.items?.filter((msg: Message) => msg.id !== deletedId),
            }));

            return { ...oldData, pages: newPages };
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, queryKey, queryClient]);
};

// Hook for presence (who's online)
interface UseRealtimePresenceProps {
  roomId: string;
  userId: string;
  userName: string;
}

export const useRealtimePresence = ({
  roomId,
  userId,
  userName,
}: UseRealtimePresenceProps) => {
  useEffect(() => {
    if (!roomId || !userId) return;

    const channel = supabase.channel(`presence:${roomId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        console.log("[Presence] Synced:", state);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("[Presence] Joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("[Presence] Left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            user_id: userId,
            user_name: userName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [roomId, userId, userName]);
};
