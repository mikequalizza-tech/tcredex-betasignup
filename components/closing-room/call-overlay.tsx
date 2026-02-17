"use client";

import { useState, useCallback } from "react";
import { Phone, Video, Minimize2, Maximize2, X, PhoneOff } from "lucide-react";
import { MediaRoom } from "./media-room";

interface CallOverlayProps {
  dealId: string;
  roomId: string;
  video: boolean;
  onClose: () => void;
}

export function CallOverlay({
  dealId,
  roomId,
  video,
  onClose,
}: CallOverlayProps) {
  const [minimized, setMinimized] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag from the header bar
    if (!(e.target as HTMLElement).closest("[data-drag-handle]")) return;
    setDragging(true);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!dragging) return;
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y,
      });
    },
    [dragging, dragOffset],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(false);
  }, []);

  const overlayStyle: React.CSSProperties = position
    ? { position: "fixed", left: position.x, top: position.y, zIndex: 50 }
    : { position: "fixed", bottom: 24, right: 24, zIndex: 50 };

  if (minimized) {
    return (
      <div
        style={{ position: "fixed", bottom: 24, right: 24, zIndex: 50 }}
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-white font-medium">
            {video ? "Video Call" : "Voice Call"}
          </span>
          <div className="flex items-center gap-1 ml-2">
            <button
              onClick={() => setMinimized(false)}
              className="p-1.5 hover:bg-gray-700 rounded transition-colors"
              title="Expand"
            >
              <Maximize2 className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-900/50 rounded transition-colors"
              title="End call"
            >
              <PhoneOff className="w-4 h-4 text-red-400" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={overlayStyle}
      className="bg-gray-950 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Drag handle / header */}
      <div
        data-drag-handle
        className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border-b border-gray-800 cursor-move select-none"
      >
        <div className="flex items-center gap-2">
          {video ? (
            <Video className="w-4 h-4 text-indigo-400" />
          ) : (
            <Phone className="w-4 h-4 text-green-400" />
          )}
          <span className="text-sm font-medium text-white">
            {video ? "Video Call" : "Voice Call"}
          </span>
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors"
            title="Minimize"
          >
            <Minimize2 className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-900/50 rounded transition-colors"
            title="End call"
          >
            <X className="w-4 h-4 text-red-400" />
          </button>
        </div>
      </div>

      {/* LiveKit MediaRoom */}
      <div className="w-[480px] h-[360px]">
        <MediaRoom
          roomId={roomId}
          dealId={dealId}
          video={video}
          audio={true}
          onDisconnect={onClose}
        />
      </div>
    </div>
  );
}
