"use client";

import { useState, useRef, useCallback } from "react";
import {
  DocumentCategory,
  EntityType,
  DOCUMENT_CATEGORIES,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE,
  formatFileSize,
} from "@/lib/documents/types";

interface DocumentUploaderProps {
  entityType: EntityType;
  entityId: string;
  entityName: string;
  onUploadComplete?: (documentId: string) => void;
  onCancel?: () => void;
  isNewVersion?: boolean;
  existingDocumentId?: string;
}

export default function DocumentUploader({
  entityType,
  entityId: _entityId,
  entityName,
  onUploadComplete,
  onCancel,
  isNewVersion = false,
  existingDocumentId: _existingDocumentId,
}: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("other");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [requiredForClosing, setRequiredForClosing] = useState(false);
  const [changeNotes, setChangeNotes] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "File type not allowed. Please upload PDF, Word, Excel, or image files.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`;
    }
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      setError(null);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        const validationError = validateFile(droppedFile);
        if (validationError) {
          setError(validationError);
          return;
        }
        setFile(droppedFile);
        if (!name) {
          setName(droppedFile.name.replace(/\.[^/.]+$/, "")); // Remove extension
        }
      }
    },
    [name],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validationError = validateFile(selectedFile);
      if (validationError) {
        setError(validationError);
        return;
      }
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleUpload = async () => {
    if (!file || !name) return;

    setIsUploading(true);
    setError(null);

    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        setUploadProgress(i);
      }

      // TODO: Actual upload to API
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('name', name);
      // formData.append('description', description);
      // formData.append('category', category);
      // formData.append('entityType', entityType);
      // formData.append('entityId', entityId);
      // formData.append('tags', JSON.stringify(tags));
      // formData.append('requiredForClosing', String(requiredForClosing));
      // if (isNewVersion) {
      //   formData.append('existingDocumentId', existingDocumentId);
      //   formData.append('changeNotes', changeNotes);
      // }

      // Simulate success
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockDocumentId = `DOC-${Date.now()}`;
      onUploadComplete?.(mockDocumentId);
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">
        {isNewVersion ? "Upload New Version" : "Upload Document"}
      </h2>

      {/* Entity Info */}
      <div className="mb-6 p-3 bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-400">
          Uploading to:{" "}
          <span className="text-gray-200 font-medium">{entityName}</span>
          <span className="text-gray-500 ml-2">({entityType})</span>
        </p>
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-indigo-500 bg-indigo-900/20"
            : file
              ? "border-green-500 bg-green-900/20"
              : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept={ALLOWED_FILE_TYPES.join(",")}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <span className="text-3xl">📄</span>
            <div className="text-left">
              <p className="text-gray-200 font-medium">{file.name}</p>
              <p className="text-sm text-gray-400">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setFile(null);
              }}
              className="ml-4 text-gray-400 hover:text-red-400"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 text-gray-500 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-300 mb-1">
              Drag and drop or click to upload
            </p>
            <p className="text-sm text-gray-500">
              PDF, Word, Excel, Images up to {formatFileSize(MAX_FILE_SIZE)}
            </p>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900/30 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* Form Fields */}
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Document Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter document name"
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
            rows={2}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {!isNewVersion && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
            >
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        )}

        {isNewVersion && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Change Notes <span className="text-red-400">*</span>
            </label>
            <textarea
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              placeholder="Describe what changed in this version"
              rows={2}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        {/* Tags */}
        {!isNewVersion && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-sm flex items-center gap-1"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), handleAddTag())
                }
                placeholder="Add tag"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Required for closing checkbox */}
        {!isNewVersion && (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={requiredForClosing}
              onChange={(e) => setRequiredForClosing(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-300">Required for closing</span>
          </label>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Uploading...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleUpload}
          disabled={
            !file || !name || isUploading || (isNewVersion && !changeNotes)
          }
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            !file || !name || isUploading || (isNewVersion && !changeNotes)
              ? "bg-gray-700 text-gray-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white"
          }`}
        >
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
