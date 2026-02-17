"use client";

import { useRef, ElementRef, Fragment } from "react";
import { format } from "date-fns";
import { Loader2, ServerCrash } from "lucide-react";
import { useChatQuery } from "@/hooks/use-chat-query";
import { useRealtimeMessages } from "@/hooks/use-supabase-realtime";
import { useChatScroll } from "@/hooks/use-chat-scroll";
import { ChatItem } from "./chat-item";
import { ChatWelcome } from "./chat-welcome";

const DATE_FORMAT = "d MMM yyyy, HH:mm";

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

interface ChatMessagesProps {
  roomId: string;
  roomName: string;
  roomType: "text" | "audio" | "video";
  apiUrl: string;
  paramKey: string;
  paramValue: string;
  currentUserId: string;
}

export function ChatMessages({
  roomId,
  roomName,
  roomType,
  apiUrl,
  paramKey,
  paramValue,
  currentUserId,
}: ChatMessagesProps) {
  const queryKey = `chat:${roomId}`;

  const chatRef = useRef<ElementRef<"div">>(null);
  const bottomRef = useRef<ElementRef<"div">>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useChatQuery({
      queryKey,
      apiUrl,
      paramKey,
      paramValue,
    });

  // Use Supabase Realtime instead of Socket.io
  useRealtimeMessages({ roomId, queryKey });

  useChatScroll({
    chatRef,
    bottomRef,
    loadMore: fetchNextPage,
    shouldLoadMore: !isFetchingNextPage && !!hasNextPage,
    count: data?.pages?.[0]?.items?.length ?? 0,
  });

  if (status === "pending") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-gray-400 animate-spin my-4" />
        <p className="text-sm text-gray-400">Loading messages...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex flex-col flex-1 justify-center items-center">
        <ServerCrash className="h-7 w-7 text-red-400 my-4" />
        <p className="text-sm text-gray-400">Something went wrong!</p>
      </div>
    );
  }

  return (
    <div ref={chatRef} className="flex-1 flex flex-col py-4 overflow-y-auto">
      {!hasNextPage && <div className="flex-1" />}
      {!hasNextPage && <ChatWelcome roomName={roomName} roomType={roomType} />}

      {hasNextPage && (
        <div className="flex justify-center">
          {isFetchingNextPage ? (
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin my-4" />
          ) : (
            <button
              onClick={() => fetchNextPage()}
              className="text-gray-400 hover:text-gray-300 text-xs my-4 transition"
            >
              Load previous messages
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col-reverse mt-auto">
        {data?.pages?.map((group, i) => (
          <Fragment key={i}>
            {group.items.map((message: Message) => (
              <ChatItem
                key={message.id}
                id={message.id}
                content={message.content}
                senderName={message.sender_name}
                senderOrgName={message.sender_org_name}
                fileUrl={message.file_url}
                deleted={message.deleted}
                timestamp={format(new Date(message.created_at), DATE_FORMAT)}
                isUpdated={message.updated_at !== message.created_at}
                currentUserId={currentUserId}
                senderId={message.sender_id}
                roomId={roomId}
              />
            ))}
          </Fragment>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
