"use client";

import React, { useState } from "react";
import { ProjectImage } from "@/types/intake";
import { normalizeProjectImages } from "@/lib/utils/project-images";

interface PhotoGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<ProjectImage | string>;
  featuredImageId?: string;
  isOwner: boolean;
  onSelectFeatured?: (imageId: string) => Promise<void>;
  projectName?: string;
}

/**
 * PhotoGalleryModal - View all project photos and select featured image
 *
 * Features:
 * - Grid view of all project images
 * - Full-size preview on click
 * - Featured image selection (Sponsor only)
 * - Featured image indicator
 */
export default function PhotoGalleryModal({
  isOpen,
  onClose,
  images,
  featuredImageId,
  isOwner,
  onSelectFeatured,
  projectName = "Project",
}: PhotoGalleryModalProps) {
  const [selectedImage, setSelectedImage] = useState<ProjectImage | null>(null);
  const [settingFeatured, setSettingFeatured] = useState(false);
  const normalizedImages = normalizeProjectImages(images);

  if (!isOpen) return null;

  const handleSetFeatured = async (imageId: string) => {
    if (!onSelectFeatured || !isOwner) return;

    setSettingFeatured(true);
    try {
      await onSelectFeatured(imageId);
    } finally {
      setSettingFeatured(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-semibold text-white">Project Photos</h2>
            <p className="text-sm text-gray-400">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-400"
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {normalizedImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📷</div>
              <p className="text-gray-400">No photos uploaded yet</p>
              {isOwner && (
                <p className="text-sm text-gray-500 mt-2">
                  Upload photos in the intake form to showcase your project
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Instructions for Sponsor */}
              {isOwner && onSelectFeatured && (
                <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-indigo-400 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-indigo-300 font-medium">
                        Select Featured Image
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Click on any image and then "Set as Featured" to use it
                        as the main hero image on your Deal Page, Project
                        Profile, and Deal Card.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Image Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {normalizedImages.map((image, index) => {
                  const imageId = image.id || `image-${index}`;
                  const isFeatured = featuredImageId === imageId;
                  const isSelected = selectedImage?.id === image.id;

                  return (
                    <div
                      key={imageId}
                      onClick={() => setSelectedImage(image)}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        isFeatured
                          ? "border-amber-500 ring-2 ring-amber-500/30"
                          : isSelected
                            ? "border-indigo-500 ring-2 ring-indigo-500/30"
                            : "border-gray-700 hover:border-gray-600"
                      }`}
                    >
                      <div className="aspect-video bg-gray-800">
                        {image.url ? (
                          <img
                            src={image.url}
                            alt={image.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                            No preview
                          </div>
                        )}
                      </div>

                      {/* Featured badge */}
                      {isFeatured && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-amber-500 text-amber-900 text-xs font-bold rounded flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Featured
                        </div>
                      )}

                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          Click to view
                        </span>
                      </div>

                      {/* Image name */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2">
                        <p className="text-xs text-gray-300 truncate">
                          {image.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer - Selected image actions */}
        {selectedImage && (
          <div className="border-t border-gray-800 px-6 py-4 bg-gray-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-12 rounded overflow-hidden bg-gray-700">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {selectedImage.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedImage.size
                      ? `${(selectedImage.size / 1024 / 1024).toFixed(2)} MB`
                      : "Size unknown"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Set as Featured (Sponsor only) */}
                {isOwner && onSelectFeatured && (
                  <button
                    onClick={() =>
                      handleSetFeatured(
                        selectedImage.id || `${selectedImage.name}-0`,
                      )
                    }
                    disabled={
                      settingFeatured || featuredImageId === selectedImage.id
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                      featuredImageId === selectedImage.id
                        ? "bg-amber-600 text-white cursor-default"
                        : settingFeatured
                          ? "bg-gray-700 text-gray-400 cursor-wait"
                          : "bg-amber-600 hover:bg-amber-500 text-white"
                    }`}
                  >
                    {settingFeatured ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Setting...
                      </>
                    ) : featuredImageId === selectedImage.id ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        Current Featured
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                          />
                        </svg>
                        Set as Featured
                      </>
                    )}
                  </button>
                )}

                {/* View Full Size */}
                <a
                  href={selectedImage.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm font-medium transition-colors"
                >
                  View Full Size
                </a>

                {/* Clear selection */}
                <button
                  onClick={() => setSelectedImage(null)}
                  className="px-4 py-2 border border-gray-600 hover:bg-gray-800 text-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
