"use client";

import { useState } from "react";
import Image from "next/image";
import { Edit, Trash, FileText, ExternalLink, X, Check } from "lucide-react";

interface ChatItemProps {
  id: string;
  content: string;
  senderName: string;
  senderOrgName: string;
  fileUrl?: string;
  deleted: boolean;
  timestamp: string;
  isUpdated: boolean;
  currentUserId: string;
  senderId: string;
  roomId: string;
}

export function ChatItem({
  id,
  content,
  senderName,
  senderOrgName,
  fileUrl,
  deleted,
  timestamp,
  isUpdated,
  currentUserId,
  senderId,
  roomId,
}: ChatItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isLoading, setIsLoading] = useState(false);

  const isOwner = currentUserId === senderId;
  const canEdit = isOwner && !deleted;
  const canDelete = isOwner && !deleted;
  const isImage = fileUrl && /\.(jpg|jpeg|png|gif|webp)$/i.test(fileUrl);
  const isPdf = fileUrl && /\.pdf$/i.test(fileUrl);

  const handleEdit = async () => {
    if (!editedContent.trim() || editedContent === content) {
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/closing-room/messages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: editedContent,
          roomId,
        }),
      });

      if (response.ok) {
        setIsEditing(false);
      }
    } catch (error) {
      console.error("[ChatItem] Edit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this message?")) return;

    setIsLoading(true);
    try {
      await fetch(`/api/closing-room/messages/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });
    } catch (error) {
      console.error("[ChatItem] Delete error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative group flex items-start hover:bg-gray-800/50 px-4 py-2 transition">
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
        {senderName.charAt(0).toUpperCase()}
      </div>

      <div className="ml-3 flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm">{senderName}</span>
          <span className="text-xs text-gray-500">{senderOrgName}</span>
          <span className="text-xs text-gray-600">{timestamp}</span>
          {isUpdated && !deleted && (
            <span className="text-xs text-gray-600">(edited)</span>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1">
            <input
              type="text"
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              disabled={isLoading}
              className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
            />
            <button
              onClick={handleEdit}
              disabled={isLoading}
              className="p-1 text-green-400 hover:text-green-300"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsEditing(false)}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <p
            className={`text-sm mt-0.5 ${
              deleted ? "text-gray-500 italic" : "text-gray-300"
            }`}
          >
            {content}
          </p>
        )}

        {/* File attachment */}
        {fileUrl && !deleted && (
          <div className="mt-2">
            {isImage ? (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block w-48 h-48 rounded-lg overflow-hidden border border-gray-700"
              >
                <Image
                  src={fileUrl}
                  alt="Attachment"
                  fill
                  className="object-cover"
                />
              </a>
            ) : (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition max-w-xs"
              >
                {isPdf ? (
                  <FileText className="h-8 w-8 text-red-400" />
                ) : (
                  <FileText className="h-8 w-8 text-indigo-400" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">Document</p>
                  <p className="text-xs text-gray-500">Click to open</p>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {(canEdit || canDelete) && !isEditing && (
        <div className="absolute -top-2 right-4 hidden group-hover:flex items-center gap-1 p-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg">
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 hover:bg-gray-700 rounded transition"
            >
              <Edit className="h-4 w-4 text-gray-400" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-gray-700 rounded transition"
            >
              <Trash className="h-4 w-4 text-red-400" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
