"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Hash,
  Phone,
  Video,
  ChevronDown,
  ChevronRight,
  Plus,
  Settings,
  FileText,
  Calendar,
  CheckCircle,
} from "lucide-react";

interface Channel {
  id: string;
  name: string;
  type: "text" | "audio" | "video";
}

interface RoomSidebarProps {
  dealId: string;
  dealName: string;
  channels: Channel[];
  activeChannelId?: string;
  participants: {
    id: string;
    name: string;
    organization: string;
    role: string;
    online?: boolean;
  }[];
  onCreateChannel?: () => void;
}

export function RoomSidebar({
  dealId,
  dealName,
  channels,
  activeChannelId,
  participants,
  onCreateChannel,
}: RoomSidebarProps) {
  const [textOpen, setTextOpen] = useState(true);
  const [voiceOpen, setVoiceOpen] = useState(true);
  const [membersOpen, setMembersOpen] = useState(true);

  const textChannels = channels.filter((c) => c.type === "text");
  const voiceChannels = channels.filter(
    (c) => c.type === "audio" || c.type === "video"
  );

  const getChannelIcon = (type: string) => {
    switch (type) {
      case "audio":
        return Phone;
      case "video":
        return Video;
      default:
        return Hash;
    }
  };

  return (
    <div className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h2 className="font-semibold text-white truncate">{dealName}</h2>
        <p className="text-xs text-gray-500 mt-0.5">Closing Room</p>
      </div>

      {/* Quick Actions */}
      <div className="p-2 border-b border-gray-800">
        <div className="grid grid-cols-4 gap-1">
          <Link
            href={`/deals/${dealId}`}
            className="flex flex-col items-center p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] text-gray-500 mt-1">Docs</span>
          </Link>
          <Link
            href={`/deals/${dealId}/tasks`}
            className="flex flex-col items-center p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <CheckCircle className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] text-gray-500 mt-1">Tasks</span>
          </Link>
          <Link
            href={`/deals/${dealId}/calendar`}
            className="flex flex-col items-center p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] text-gray-500 mt-1">Calendar</span>
          </Link>
          <Link
            href={`/deals/${dealId}/settings`}
            className="flex flex-col items-center p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <Settings className="h-4 w-4 text-gray-400" />
            <span className="text-[10px] text-gray-500 mt-1">Settings</span>
          </Link>
        </div>
      </div>

      {/* Channels */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Text Channels */}
        <div className="px-2">
          <button
            onClick={() => setTextOpen(!textOpen)}
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase hover:text-gray-300"
          >
            <div className="flex items-center gap-1">
              {textOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Text Channels</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreateChannel?.();
              }}
              className="p-0.5 hover:bg-gray-700 rounded"
            >
              <Plus className="h-3 w-3" />
            </button>
          </button>

          {textOpen && (
            <div className="mt-1 space-y-0.5">
              {textChannels.map((channel) => {
                const Icon = getChannelIcon(channel.type);
                const isActive = channel.id === activeChannelId;
                return (
                  <Link
                    key={channel.id}
                    href={`/deals/${dealId}/room/${channel.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Voice/Video Channels */}
        <div className="px-2 mt-4">
          <button
            onClick={() => setVoiceOpen(!voiceOpen)}
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase hover:text-gray-300"
          >
            <div className="flex items-center gap-1">
              {voiceOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Voice Channels</span>
            </div>
          </button>

          {voiceOpen && (
            <div className="mt-1 space-y-0.5">
              {voiceChannels.map((channel) => {
                const Icon = getChannelIcon(channel.type);
                const isActive = channel.id === activeChannelId;
                return (
                  <Link
                    key={channel.id}
                    href={`/deals/${dealId}/room/${channel.id}`}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md transition ${
                      isActive
                        ? "bg-gray-700 text-white"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate text-sm">{channel.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Members */}
        <div className="px-2 mt-4">
          <button
            onClick={() => setMembersOpen(!membersOpen)}
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase hover:text-gray-300"
          >
            <div className="flex items-center gap-1">
              {membersOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <span>Members ({participants.length})</span>
            </div>
          </button>

          {membersOpen && (
            <div className="mt-1 space-y-0.5">
              {participants.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-2 px-2 py-1.5"
                >
                  <div className="relative">
                    <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-medium">
                      {member.name.charAt(0)}
                    </div>
                    {member.online && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-gray-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-300 truncate">
                      {member.name}
                    </p>
                    <p className="text-[10px] text-gray-500 truncate">
                      {member.organization}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
