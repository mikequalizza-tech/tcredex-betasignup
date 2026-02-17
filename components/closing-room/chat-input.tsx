"use client";

import { useState } from "react";
import { Send, Paperclip, Smile, X, FileText, Image } from "lucide-react";
import { UploadButton } from "@/lib/uploadthing";

interface ChatInputProps {
  roomId: string;
  apiUrl: string;
  placeholder?: string;
  onSend?: () => void;
}

export function ChatInput({
  roomId,
  apiUrl,
  placeholder = "Send a message...",
  onSend,
}: ChatInputProps) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<
    { url: string; name: string; type: string }[]
  >([]);
  const [showUpload, setShowUpload] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() && attachments.length === 0) return;

    setIsLoading(true);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          fileUrl: attachments[0]?.url || null,
          roomId,
          roomType: "text",
        }),
      });

      if (response.ok) {
        setContent("");
        setAttachments([]);
        onSend?.();
      }
    } catch (error) {
      console.error("[ChatInput] Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 border-t border-gray-800 bg-gray-900">
      {/* Attachments preview */}
      {attachments.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg"
            >
              {file.type.includes("image") ? (
                <Image className="h-4 w-4 text-indigo-400" />
              ) : (
                <FileText className="h-4 w-4 text-indigo-400" />
              )}
              <span className="text-sm text-gray-300 max-w-[150px] truncate">
                {file.name}
              </span>
              <button
                onClick={() => removeAttachment(index)}
                className="p-0.5 hover:bg-gray-700 rounded"
              >
                <X className="h-3 w-3 text-gray-400" />
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        {/* Attachment button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUpload(!showUpload)}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            <Paperclip className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>

          {showUpload && (
            <div className="absolute bottom-12 left-0 p-3 bg-gray-800 rounded-lg shadow-xl border border-gray-700 min-w-[200px]">
              <UploadButton
                endpoint="messageAttachment"
                onClientUploadComplete={(res) => {
                  if (res) {
                    setAttachments((prev) => [
                      ...prev,
                      ...res.map((file) => ({
                        url: file.url,
                        name: file.name,
                        type: file.type || "file",
                      })),
                    ]);
                  }
                  setShowUpload(false);
                }}
                onUploadError={(error) => {
                  console.error("[Upload] Error:", error);
                }}
                appearance={{
                  button:
                    "bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg",
                  allowedContent: "text-gray-400 text-xs mt-2",
                }}
              />
            </div>
          )}
        </div>

        {/* Message input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            disabled={isLoading}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            <Smile className="h-5 w-5 text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* Send button */}
        <button
          type="submit"
          disabled={isLoading || (!content.trim() && attachments.length === 0)}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
        >
          <Send className="h-5 w-5 text-white" />
        </button>
      </form>
    </div>
  );
}
