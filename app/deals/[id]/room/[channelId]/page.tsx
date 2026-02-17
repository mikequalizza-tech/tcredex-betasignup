"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  CallOverlay,
  ChatHeader,
  ChatInput,
  ChatMessages,
  MediaRoom,
  RoomSidebar,
} from "@/components/closing-room";
import { QueryProvider } from "@/contexts/query-provider";

interface Channel {
  id: string;
  name: string;
  type: "text" | "audio" | "video";
}

interface Participant {
  id: string;
  name: string;
  organization: string;
  role: string;
  online?: boolean;
}

export default function ClosingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const dealId = (params?.id ?? "") as string;
  const channelId = (params?.channelId ?? "") as string;

  const [deal, setDeal] = useState<{
    id: string;
    name: string;
    project_name: string;
  } | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [callActive, setCallActive] = useState(false);
  const [callVideo, setCallVideo] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push(`/signin?redirect=/deals/${dealId}/room/${channelId}`);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch deal info
        const dealRes = await fetch(`/api/deals/${dealId}`);
        if (dealRes.ok) {
          const dealData = await dealRes.json();
          setDeal(dealData.deal);
        }

        // Fetch channels for this deal
        const channelsRes = await fetch(
          `/api/closing-room/channels?dealId=${dealId}`,
        );
        if (channelsRes.ok) {
          const channelsData = await channelsRes.json();
          setChannels(channelsData.channels || []);

          // Find current channel
          const currentChannel = channelsData.channels?.find(
            (c: Channel) => c.id === channelId,
          );
          setChannel(currentChannel || null);
        }

        // Fetch participants
        const participantsRes = await fetch(
          `/api/closing-room/participants?dealId=${dealId}`,
        );
        if (participantsRes.ok) {
          const participantsData = await participantsRes.json();
          setParticipants(participantsData.participants || []);
        }
      } catch (error) {
        console.error("[ClosingRoom] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dealId, channelId, isAuthenticated, isLoading, router]);

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-white mb-2">
            Deal not found
          </h1>
          <button
            onClick={() => router.push("/deals")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Back to Deals
          </button>
        </div>
      </div>
    );
  }

  const roomName = channel?.name || "general";
  const roomType = channel?.type || "text";

  return (
    <QueryProvider>
      <div className="flex h-screen bg-gray-950">
        {/* Sidebar */}
        <RoomSidebar
          dealId={dealId}
          dealName={deal.project_name || deal.name}
          channels={channels}
          activeChannelId={channelId}
          participants={participants}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          <ChatHeader
            roomName={roomName}
            roomType={roomType}
            participantCount={participants.length}
            onVideoCall={() => {
              setCallVideo(true);
              setCallActive(true);
            }}
            onVoiceCall={() => {
              setCallVideo(false);
              setCallActive(true);
            }}
          />

          {roomType === "text" ? (
            <>
              <ChatMessages
                roomId={channelId}
                roomName={roomName}
                roomType={roomType}
                apiUrl="/api/closing-room/messages"
                paramKey="roomId"
                paramValue={channelId}
                currentUserId={user?.id || ""}
              />
              <ChatInput
                roomId={channelId}
                apiUrl="/api/closing-room/messages"
              />
            </>
          ) : (
            <MediaRoom
              roomId={channelId}
              dealId={dealId}
              video={roomType === "video"}
              audio={true}
            />
          )}
        </div>

        {/* Voice/Video Call Overlay */}
        {callActive && (
          <CallOverlay
            dealId={dealId}
            roomId={channelId}
            video={callVideo}
            onClose={() => setCallActive(false)}
          />
        )}
      </div>
    </QueryProvider>
  );
}
