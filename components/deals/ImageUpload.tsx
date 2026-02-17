"use client";

import { useState, useRef } from "react";
import Image from "next/image";

interface ImageUploadProps {
  label: string;
  currentUrl?: string;
  onUpload: (url: string) => void;
  onRemove?: () => void;
  aspectRatio?: "square" | "wide" | "hero";
  maxSizeMB?: number;
  className?: string;
}

export default function ImageUpload({
  label,
  currentUrl,
  onUpload,
  onRemove,
  aspectRatio = "square",
  maxSizeMB = 5,
  className = "",
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const aspectClasses = {
    square: "aspect-square",
    wide: "aspect-[3/1]",
    hero: "aspect-[16/9]",
  };

  const handleFile = async (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file");
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Upload to our API endpoint
      const response = await fetch("/api/upload/deal-media", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }

      const { url } = await response.json();
      onUpload(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    if (e.dataTransfer.files?.[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>

      {currentUrl ? (
        <div className="relative group">
          <div
            className={`relative ${aspectClasses[aspectRatio]} bg-gray-800 rounded-lg overflow-hidden`}
          >
            <Image
              src={currentUrl}
              alt={label}
              fill
              className="object-contain"
            />
          </div>
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded-lg">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
            >
              Replace
            </button>
            {onRemove && (
              <button
                type="button"
                onClick={onRemove}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`
            relative ${aspectClasses[aspectRatio]} border-2 border-dashed rounded-lg
            flex flex-col items-center justify-center cursor-pointer transition-colors
            ${
              dragActive
                ? "border-indigo-500 bg-indigo-500/10"
                : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
            }
          `}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
              <span className="text-sm text-gray-400">Uploading...</span>
            </div>
          ) : (
            <>
              <svg
                className="w-10 h-10 text-gray-500 mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-sm text-gray-400">
                Drop image here or click to upload
              </span>
              <span className="text-xs text-gray-500 mt-1">
                PNG, JPG up to {maxSizeMB}MB
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />

      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
