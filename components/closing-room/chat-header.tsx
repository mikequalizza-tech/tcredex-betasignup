"use client";

import { Hash, Users, Video, Phone, MoreVertical } from "lucide-react";
import { SocketIndicator } from "./socket-indicator";

interface ChatHeaderProps {
  roomName: string;
  roomType: "text" | "audio" | "video";
  participantCount?: number;
  onVideoCall?: () => void;
  onVoiceCall?: () => void;
}

export function ChatHeader({
  roomName,
  roomType,
  participantCount = 0,
  onVideoCall,
  onVoiceCall,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900">
      <div className="flex items-center gap-2">
        {roomType === "text" && (
          <Hash className="h-5 w-5 text-gray-400" />
        )}
        {roomType === "audio" && (
          <Phone className="h-5 w-5 text-green-500" />
        )}
        {roomType === "video" && (
          <Video className="h-5 w-5 text-indigo-500" />
        )}
        <h2 className="font-semibold text-white">{roomName}</h2>
        {participantCount > 0 && (
          <div className="flex items-center gap-1 ml-2 text-gray-400 text-sm">
            <Users className="h-4 w-4" />
            <span>{participantCount}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <SocketIndicator />

        {roomType === "text" && (
          <>
            <button
              onClick={onVoiceCall}
              className="p-2 hover:bg-gray-800 rounded-md transition"
              title="Start voice call"
            >
              <Phone className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
            <button
              onClick={onVideoCall}
              className="p-2 hover:bg-gray-800 rounded-md transition"
              title="Start video call"
            >
              <Video className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </>
        )}

        <button className="p-2 hover:bg-gray-800 rounded-md transition">
          <MoreVertical className="h-5 w-5 text-gray-400 hover:text-white" />
        </button>
      </div>
    </div>
  );
}
