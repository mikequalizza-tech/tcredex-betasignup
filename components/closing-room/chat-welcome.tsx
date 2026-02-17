"use client";

import { Hash, Phone, Video } from "lucide-react";

interface ChatWelcomeProps {
  roomName: string;
  roomType: "text" | "audio" | "video";
}

export function ChatWelcome({ roomName, roomType }: ChatWelcomeProps) {
  return (
    <div className="space-y-2 px-4 mb-4">
      <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center">
        {roomType === "text" && <Hash className="h-8 w-8 text-white" />}
        {roomType === "audio" && <Phone className="h-8 w-8 text-green-500" />}
        {roomType === "video" && <Video className="h-8 w-8 text-indigo-500" />}
      </div>
      <p className="text-xl md:text-2xl font-bold text-white">
        Welcome to #{roomName}
      </p>
      <p className="text-gray-400 text-sm">
        {roomType === "text" &&
          "This is the start of the conversation. All messages are private to deal participants."}
        {roomType === "audio" &&
          "This is a voice channel. Join to talk with other participants."}
        {roomType === "video" &&
          "This is a video channel. Join for face-to-face meetings."}
      </p>
    </div>
  );
}
