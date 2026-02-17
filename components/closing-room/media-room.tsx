"use client";

import { useCurrentUser } from "@/lib/auth/useCurrentUser";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface MediaRoomProps {
  roomId: string;
  dealId: string;
  video: boolean;
  audio: boolean;
  onDisconnect?: () => void;
}

export function MediaRoom({
  roomId,
  dealId,
  video,
  audio,
  onDisconnect,
}: MediaRoomProps) {
  const { user, isLoading } = useCurrentUser();
  const router = useRouter();
  const [token, setToken] = useState("");

  useEffect(() => {
    const name = user?.name || user?.email?.split("@")[0];

    if (!name) return;

    (async () => {
      try {
        const resp = await fetch(`/api/livekit?room=${roomId}`);
        const data = await resp.json();
        if (data.token) {
          setToken(data.token);
        }
      } catch (e) {
        console.error("[MediaRoom] Error getting token:", e);
      }
    })();
  }, [roomId, user]);

  if (token === "" || isLoading) {
    return (
      <div className="flex flex-col flex-1 justify-center items-center bg-gray-900">
        <Loader2 className="h-7 w-7 text-indigo-500 animate-spin my-4" />
        <p className="text-gray-400 text-sm">Connecting to room...</p>
      </div>
    );
  }

  return (
    <LiveKitRoom
      video={video}
      audio={audio}
      token={token}
      serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
      connect={true}
      onDisconnected={() => {
        if (onDisconnect) {
          onDisconnect();
        } else {
          router.push(`/deals/${dealId}`);
        }
      }}
      data-lk-theme="default"
      className="flex flex-col flex-1 h-full bg-gray-950"
    >
      <VideoConference />
      <RoomAudioRenderer />
      <ControlBar className="bg-gray-900 border-t border-gray-800" />
    </LiveKitRoom>
  );
}

function VideoConference() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false }
  );

  return (
    <GridLayout
      tracks={tracks}
      className="flex-1 p-4"
    >
      <ParticipantTile className="rounded-lg overflow-hidden" />
    </GridLayout>
  );
}
