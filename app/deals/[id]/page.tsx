"use client";

import { use, useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchDealById } from "@/lib/supabase/queries";
import { Deal } from "@/lib/data/deals";
import DealActionModals from "@/components/deals/DealActionModals";
import DealActionPanel, {
  ActionModalType,
} from "@/components/deals/DealActionPanel";
import PhotoGalleryModal from "@/components/deals/PhotoGalleryModal";
import { CompletenessScore } from "@/components/deals/CompletenessScore";
import CapitalStack from "@/components/deals/CapitalStack";
import DealPipelineTracker from "@/components/deals/DealPipelineTracker";
import {
  calculateReadiness,
  getTierDisplay,
} from "@/lib/intake/readinessScore";
import ClosingChecklist from "@/components/closing/ClosingChecklist";
import { useBreadcrumbs } from "@/lib/context/BreadcrumbContext";
import { useCurrentUser } from "@/lib/auth";

// Types for outreach recipients
interface OutreachRecipient {
  id: string;
  organizationId: string;
  name: string;
  website?: string;
  isSystemUser: boolean;
  isContacted: boolean;
  matchScore: number;
  // CDE-specific
  missionStatement?: string;
  geographicFocus?: string[];
  sectorFocus?: string[];
  allocationAvailable?: number;
  // Investor-specific
  programs?: string[];
  sectors?: string[];
  minInvestment?: number;
  maxInvestment?: number;
}

interface OutreachData {
  cdes?: OutreachRecipient[];
  investors?: OutreachRecipient[];
  limits: { cde: number; investor: number };
}

// Program colors for display
const PROGRAM_COLORS: Record<
  string,
  { gradient: string; bg: string; text: string; border: string }
> = {
  NMTC: {
    gradient: "from-emerald-500 to-teal-600",
    bg: "bg-emerald-900/30",
    text: "text-emerald-300",
    border: "border-emerald-500/30",
  },
  HTC: {
    gradient: "from-blue-500 to-indigo-600",
    bg: "bg-blue-900/30",
    text: "text-blue-300",
    border: "border-blue-500/30",
  },
  LIHTC: {
    gradient: "from-indigo-600 to-purple-700",
    bg: "bg-purple-900/30",
    text: "text-purple-300",
    border: "border-purple-500/30",
  },
  OZ: {
    gradient: "from-amber-500 to-orange-600",
    bg: "bg-amber-900/30",
    text: "text-amber-300",
    border: "border-amber-500/30",
  },
  Brownfield: {
    gradient: "from-yellow-500 to-lime-600",
    bg: "bg-yellow-900/30",
    text: "text-yellow-300",
    border: "border-yellow-500/30",
  },
};
const DEFAULT_PROGRAM_COLORS = PROGRAM_COLORS.NMTC;

// Status display config
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-gray-700 text-gray-400" },
  submitted: { label: "Submitted", color: "bg-blue-900/50 text-blue-400" },
  under_review: {
    label: "Under Review",
    color: "bg-amber-900/50 text-amber-400",
  },
  available: { label: "Available", color: "bg-green-900/50 text-green-400" },
  seeking_capital: {
    label: "Seeking Capital",
    color: "bg-indigo-900/50 text-indigo-400",
  },
  matched: { label: "Matched", color: "bg-purple-900/50 text-purple-400" },
  closing: { label: "Closing", color: "bg-teal-900/50 text-teal-400" },
  closed: { label: "Closed", color: "bg-emerald-900/50 text-emerald-400" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-800 text-gray-400" },
};

// Project Image Gallery Component
function ProjectImageGallery({
  projectName,
  dealId,
  programType,
  isOwner = false,
  onImagesChange,
}: {
  projectName: string;
  dealId: string;
  programType: string;
  isOwner?: boolean;
  onImagesChange?: (images: string[]) => void;
}) {
  const [images, setImages] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});
  const [_uploading, _setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Fetch project images from API
  useEffect(() => {
    async function fetchImages() {
      setLoading(true);
      try {
        // Try to fetch images from the deal's attachments/media
        const response = await fetch(`/api/deals/${dealId}/media`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            setImages(data.images);
          } else {
            // Use placeholder images based on program type
            setImages([]);
          }
        } else {
          setImages([]);
        }
      } catch {
        setImages([]);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, [dealId]);

  // Get program-specific placeholder
  const getPlaceholderContent = () => {
    const placeholders: Record<
      string,
      { icon: string; color: string; label: string }
    > = {
      NMTC: {
        icon: "🏗️",
        color: "from-emerald-600 to-teal-700",
        label: "New Markets Tax Credit",
      },
      HTC: {
        icon: "🏛️",
        color: "from-blue-600 to-indigo-700",
        label: "Historic Tax Credit",
      },
      LIHTC: {
        icon: "🏘️",
        color: "from-purple-600 to-pink-700",
        label: "Low-Income Housing",
      },
      OZ: {
        icon: "🌆",
        color: "from-amber-600 to-orange-700",
        label: "Opportunity Zone",
      },
    };
    return placeholders[programType] || placeholders.NMTC;
  };

  const placeholder = getPlaceholderContent();

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-800/50 animate-pulse">
        <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
      </div>
    );
  }

  // No images - show styled placeholder
  if (images.length === 0) {
    return (
      <div
        className={`h-80 bg-gradient-to-br ${placeholder.color} flex items-center justify-center relative overflow-hidden`}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.1) 35px, rgba(255,255,255,.1) 70px)",
            }}
          />
        </div>

        <div className="text-center relative z-10">
          <div className="text-6xl mb-4">{placeholder.icon}</div>
          <h3 className="text-2xl font-bold text-white mb-2">{projectName}</h3>
          <p className="text-white/70 text-sm">{placeholder.label} Project</p>
          <p className="text-white/50 text-xs mt-3">
            Project images coming soon
          </p>
        </div>

        {/* Upload prompt for owners */}
        {isOwner && (
          <div className="absolute bottom-4 right-4">
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-sm rounded-lg backdrop-blur-sm transition-colors flex items-center gap-2"
            >
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Add Photos
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <ImageUploadModal
            dealId={dealId}
            onClose={() => setShowUploadModal(false)}
            onUploadComplete={(newUrls) => {
              const updated = [...images, ...newUrls];
              setImages(updated);
              onImagesChange?.(updated);
              setShowUploadModal(false);
            }}
          />
        )}
      </div>
    );
  }

  // Has images - show gallery
  return (
    <div className="relative">
      {/* Main Image */}
      <div className="relative h-80 bg-gray-800">
        {!imageError[selectedIndex] ? (
          <img
            src={images[selectedIndex]}
            alt={`${projectName} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
            onError={() =>
              setImageError((prev) => ({ ...prev, [selectedIndex]: true }))
            }
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${placeholder.color} flex items-center justify-center`}
          >
            <div className="text-6xl">{placeholder.icon}</div>
          </div>
        )}

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1,
                )
              }
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={() =>
                setSelectedIndex((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1,
                )
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors"
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Image counter */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-sm">
          {selectedIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnail strip */}
      {(images.length > 1 || isOwner) && (
        <div className="flex gap-2 p-3 bg-gray-800/50 overflow-x-auto items-center">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className={`flex-shrink-0 w-16 h-12 rounded overflow-hidden border-2 transition-colors ${
                selectedIndex === idx
                  ? "border-indigo-500"
                  : "border-transparent hover:border-gray-600"
              }`}
            >
              <img
                src={img}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
          {isOwner && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex-shrink-0 w-16 h-12 rounded border-2 border-dashed border-gray-600 hover:border-indigo-500 flex items-center justify-center text-gray-400 hover:text-indigo-400 transition-colors"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <ImageUploadModal
          dealId={dealId}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={(newUrls) => {
            const updated = [...images, ...newUrls];
            setImages(updated);
            onImagesChange?.(updated);
            setShowUploadModal(false);
          }}
        />
      )}
    </div>
  );
}

// Image Upload Modal Component
function ImageUploadModal({
  dealId,
  onClose,
  onUploadComplete,
}: {
  dealId: string;
  onClose: () => void;
  onUploadComplete: (urls: string[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError(null);
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("dealId", dealId);

        const res = await fetch("/api/upload/deal-media", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          if (result.url) {
            newUrls.push(result.url);
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error("[ImageUpload] Upload failed:", res.status, errData);
          setError(errData.error || "Failed to upload image");
        }
      }

      if (newUrls.length > 0) {
        // Save URLs to deal's intake_data
        const response = await fetch(`/api/deals/${dealId}/media`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ urls: newUrls }),
        });

        if (response.ok) {
          setUploadedUrls((prev) => [...prev, ...newUrls]);
          onUploadComplete(newUrls);
        } else {
          setError("Failed to save images to deal");
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
        <h3 className="text-xl font-semibold text-white mb-2">
          Upload Project Photos
        </h3>
        <p className="text-gray-400 text-sm mb-6">
          Add photos to showcase your project
        </p>

        <div className="space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-600 hover:border-indigo-500 rounded-lg p-8 text-center cursor-pointer transition-colors"
          >
            <svg
              className="w-12 h-12 mx-auto text-gray-500 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-gray-300 font-medium">Click to select images</p>
            <p className="text-gray-500 text-sm mt-1">
              PNG, JPG up to 8MB each
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {uploading && (
            <div className="flex items-center gap-3 text-gray-300">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          )}

          {error && (
            <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3">
              <p className="text-sm text-amber-300">{error}</p>
            </div>
          )}

          {uploadedUrls.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {uploadedUrls.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Uploaded ${idx + 1}`}
                  className="w-16 h-16 object-cover rounded"
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
          >
            {uploadedUrls.length > 0 ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface DealPageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: DealPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [deal, setDeal] = useState<Deal | undefined>(undefined);
  const [dealLoading, setDealLoading] = useState(true);
  const {
    isAuthenticated,
    isLoading,
    orgType,
    userName,
    orgName,
    organizationId,
    userId,
  } = useCurrentUser();

  // Calculate C-Score (form completeness)
  // Merge intake_data and draftData to ensure we have all fields
  const completenessResult = useMemo(() => {
    const draftDataObj = (deal?.draftData as Record<string, unknown>) || {};
    const intakeDataObj = (deal?.intake_data as Record<string, unknown>) || {};
    const mergedData = { ...draftDataObj, ...intakeDataObj };

    if (Object.keys(mergedData).length === 0) return null;
    try {
      return calculateReadiness(mergedData);
    } catch (error) {
      console.error("Error calculating completeness score:", error);
      return null;
    }
  }, [deal]);

  const cScoreTierDisplay = completenessResult
    ? getTierDisplay(completenessResult.tier)
    : null;

  // Ownership detection - is current user the sponsor of this deal?
  const isOwner = !!(
    orgType === "sponsor" &&
    deal?.sponsorOrganizationId &&
    deal.sponsorOrganizationId === organizationId
  );

  // Ownership debug only when explicitly enabled
  if (
    process.env.NODE_ENV === "development" &&
    typeof window !== "undefined" &&
    (window as unknown as Record<string, unknown>).__DEBUG_DEAL_OWNERSHIP
  ) {
    console.log("[Deal Page] Ownership check:", {
      orgType,
      organizationId,
      dealSponsorOrgId: deal?.sponsorOrganizationId,
      isOwner,
      dealName: deal?.projectName,
    });
  }

  useEffect(() => {
    async function loadDeal() {
      setDealLoading(true);
      try {
        const fetchedDeal = await fetchDealById(id);
        setDeal(fetchedDeal || undefined);
      } catch (error) {
        console.error("Failed to load deal:", error);
      } finally {
        setDealLoading(false);
      }
    }
    loadDeal();
  }, [id]);

  // Set custom breadcrumbs with project name
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    if (deal?.projectName) {
      setBreadcrumbs([
        { label: "Home", href: "/dashboard" },
        { label: "Marketplace", href: "/deals" },
        { label: deal.projectName },
      ]);
    }
    // Clear breadcrumbs when leaving the page
    return () => setBreadcrumbs(null);
  }, [deal?.projectName, setBreadcrumbs]);

  const [showInterestModal, setShowInterestModal] = useState(false);
  const [interestMessage, setInterestMessage] = useState("");

  // AutoMatch state
  const [autoMatchResults, setAutoMatchResults] = useState<{
    matches: Array<{
      cdeId: string;
      cdeName: string;
      totalScore: number;
      matchStrength: "excellent" | "good" | "fair" | "weak";
      breakdown: Record<string, number>;
      reasons: string[];
    }>;
    timestamp: string;
  } | null>(null);
  const [autoMatchLoading, setAutoMatchLoading] = useState(false);
  const [autoMatchError, setAutoMatchError] = useState<string | null>(null);

  // Run AutoMatch manually
  const runAutoMatch = useCallback(async () => {
    if (!deal) return;

    setAutoMatchLoading(true);
    setAutoMatchError(null);

    try {
      const response = await fetch("/api/automatch/run", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to run AutoMatch");
      }

      const data = await response.json();
      setAutoMatchResults({
        matches: data.matches || [],
        timestamp: data.timestamp || new Date().toISOString(),
      });
    } catch (error) {
      console.error("AutoMatch error:", error);
      setAutoMatchError(
        error instanceof Error ? error.message : "Failed to run AutoMatch",
      );
    } finally {
      setAutoMatchLoading(false);
    }
  }, [deal]);
  const [interestSubmitting, setInterestSubmitting] = useState(false);
  const [interestSubmitted, setInterestSubmitted] = useState(false);

  // New modal state for role-based actions
  const [activeModal, setActiveModal] = useState<ActionModalType>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [_selectingFeaturedImage, setSelectingFeaturedImage] = useState(false);

  // Deep-link support: ?action=interest|commitment|request-info etc.
  const searchParams = useSearchParams();
  const actionParam = searchParams.get("action");
  const [actionHandled, setActionHandled] = useState(false);

  useEffect(() => {
    if (
      actionParam &&
      deal &&
      !dealLoading &&
      !actionHandled &&
      isAuthenticated &&
      !isOwner
    ) {
      const validActions: ActionModalType[] = [
        "interest",
        "commitment",
        "request-info",
        "verbal-loi",
        "loi",
        "send-message",
      ];
      if (validActions.includes(actionParam as ActionModalType)) {
        setActiveModal(actionParam as ActionModalType);
        setShowActionModal(true);
        setActionHandled(true);
      }
    }
  }, [actionParam, deal, dealLoading, actionHandled, isAuthenticated, isOwner]);

  // Sponsor outreach state (for when owner contacts CDEs/Investors)
  const [contactCDEs, setContactCDEs] = useState(true);
  const [contactInvestors, setContactInvestors] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [outreachData, setOutreachData] = useState<OutreachData | null>(null);
  const [outreachLoading, setOutreachLoading] = useState(false);
  const [outreachError, setOutreachError] = useState<string | null>(null);

  // Fetch outreach options when modal opens (for sponsors)
  const fetchOutreachOptions = useCallback(async () => {
    if (!isOwner || !organizationId) return;

    setOutreachLoading(true);
    setOutreachError(null);

    try {
      const type =
        contactCDEs && contactInvestors
          ? "both"
          : contactCDEs
            ? "cde"
            : "investor";
      const response = await fetch(
        `/api/deals/${id}/outreach?type=${type}&senderOrgId=${organizationId}`,
        { credentials: "include" },
      );

      if (!response.ok) {
        throw new Error("Failed to fetch outreach options");
      }

      const data: OutreachData = await response.json();
      setOutreachData(data);
    } catch (error) {
      console.error("Error fetching outreach options:", error);
      setOutreachError("Failed to load available partners");
    } finally {
      setOutreachLoading(false);
    }
  }, [id, isOwner, organizationId, contactCDEs, contactInvestors]);

  // Trigger outreach fetch when modal opens
  useEffect(() => {
    if (showInterestModal && isOwner && (contactCDEs || contactInvestors)) {
      fetchOutreachOptions();
    }
  }, [
    showInterestModal,
    fetchOutreachOptions,
    isOwner,
    contactCDEs,
    contactInvestors,
  ]);

  // Handle role-based actions (LOI, Commitment, Request Info)
  const handleActionSubmit = async (data: {
    type: string;
    message: string;
    senderOrgId: string;
    senderName: string;
    senderOrg: string;
  }) => {
    try {
      const endpoint = `/api/deals/${id}/${data.type}`;
      const response = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: id,
          message: data.message,
          senderOrgId: data.senderOrgId,
          senderName: data.senderName,
          senderOrg: data.senderOrg,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit action");
      }

      // Show success and close modal
      setShowActionModal(false);
      setActiveModal(null);
    } catch (error) {
      console.error("Error submitting action:", error);
      throw error;
    }
  };

  // Open action modal
  const openActionModal = (type: ActionModalType) => {
    if (type === null) {
      setShowActionModal(false);
      setActiveModal(null);
    } else {
      setActiveModal(type);
      setShowActionModal(true);
    }
  };

  // Toggle recipient selection
  const toggleRecipient = (recipientId: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(recipientId)
        ? prev.filter((id) => id !== recipientId)
        : [...prev, recipientId],
    );
  };

  const getRecipientKey = (
    recipient: Pick<OutreachRecipient, "id" | "organizationId">,
  ) => recipient.organizationId || recipient.id;

  // Get combined recipient list based on checkboxes
  const getAvailableRecipients = () => {
    if (!outreachData) return [];
    const recipients: OutreachRecipient[] = [];
    if (contactCDEs && outreachData.cdes) {
      recipients.push(
        ...outreachData.cdes.map((c) => ({ ...c, type: "cde" as const })),
      );
    }
    if (contactInvestors && outreachData.investors) {
      recipients.push(
        ...outreachData.investors.map((i) => ({
          ...i,
          type: "investor" as const,
        })),
      );
    }
    return recipients.sort((a, b) => b.matchScore - a.matchScore);
  };

  const handleExpressInterest = async () => {
    setInterestSubmitting(true);

    if (!userId) {
      setOutreachError("Session expired. Please sign in again.");
      setInterestSubmitting(false);
      return;
    }

    if (isOwner) {
      // Sponsor contacting CDEs/Investors
      if (selectedRecipients.length === 0) {
        setOutreachError("Please select at least one recipient");
        setInterestSubmitting(false);
        return;
      }

      try {
        // Group selected recipients by type
        const selectedCDEIds =
          outreachData?.cdes
            ?.filter((c) => selectedRecipients.includes(getRecipientKey(c)))
            .map((c) => getRecipientKey(c)) || [];
        const selectedInvestorIds =
          outreachData?.investors
            ?.filter((i) => selectedRecipients.includes(getRecipientKey(i)))
            .map((i) => getRecipientKey(i)) || [];

        const requests = [];

        // Send CDE requests if any selected
        if (selectedCDEIds.length > 0) {
          requests.push(
            fetch(`/api/deals/${id}/outreach`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipientIds: selectedCDEIds,
                recipientType: "cde",
                message: interestMessage,
                senderId: userId,
                senderOrgId: organizationId,
                senderName: userName,
                senderOrg: orgName,
              }),
            }),
          );
        }

        // Send Investor requests if any selected
        if (selectedInvestorIds.length > 0) {
          requests.push(
            fetch(`/api/deals/${id}/outreach`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                recipientIds: selectedInvestorIds,
                recipientType: "investor",
                message: interestMessage,
                senderId: userId,
                senderOrgId: organizationId,
                senderName: userName,
                senderOrg: orgName,
              }),
            }),
          );
        }

        const results = await Promise.all(
          requests.map(async (requestPromise) => {
            const response = await requestPromise;
            const data = await response.json().catch(() => null);
            return { response, data };
          }),
        );

        const failedResult = results.find(
          ({ response, data }) => !response.ok || data?.success === false,
        );

        if (!failedResult) {
          setInterestSubmitted(true);
          setShowInterestModal(false);
          setInterestMessage("");
          setSelectedRecipients([]);
          setOutreachData(null);
        } else {
          setOutreachError(
            failedResult.data?.error ||
              failedResult.data?.message ||
              "Failed to send some outreach requests",
          );
        }
      } catch (error) {
        console.error("Error sending outreach:", error);
        setOutreachError("Failed to send outreach. Please try again.");
      }
    } else {
      // CDE/Investor contacting Sponsor (original flow)
      try {
        const response = await fetch(`/api/messages`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId: id,
            senderId: userId,
            senderName: userName,
            senderOrg: orgName,
            content:
              interestMessage || `I am interested in ${deal?.projectName}`,
          }),
        });

        if (response.ok) {
          setInterestSubmitted(true);
          setShowInterestModal(false);
          setInterestMessage("");
        } else {
          console.error("Failed to submit interest");
        }
      } catch (error) {
        console.error("Error submitting interest:", error);
      }
    }

    setInterestSubmitting(false);
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(`/signin?redirect=/deals/${id}`);
    }
  }, [isLoading, isAuthenticated, router, id]);

  // Show loading state
  if (isLoading || dealLoading || !isAuthenticated) {
    return (
      <main className="grow flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-indigo-200/65">Loading deal...</p>
        </div>
      </main>
    );
  }

  if (!deal) {
    return (
      <main className="grow flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="font-nacelle text-3xl font-semibold text-gray-200 mb-4">
            Project Not Found
          </h1>
          <p className="text-indigo-200/65 mb-6">
            This project may no longer be available.
          </p>
          <Link
            href="/deals"
            className="btn bg-linear-to-t from-indigo-600 to-indigo-500 bg-[length:100%_100%] bg-[bottom] text-white shadow-[inset_0px_1px_0px_0px_--theme(--color-white/.16)] hover:bg-[length:100%_150%]"
          >
            Browse Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const colors = PROGRAM_COLORS[deal.programType] || DEFAULT_PROGRAM_COLORS;
  const totalBudget =
    deal.useOfFunds && deal.useOfFunds.length > 0
      ? deal.useOfFunds.reduce((sum, item) => sum + item.amount, 0)
      : deal.allocation;
  const allocations = (deal.allocations ?? deal.cdeAllocations ?? []) as Array<
    Record<string, unknown>
  >;

  // Build Sources from draftData capital stack fields
  // Merge both intake_data and draftData - intake_data takes priority
  const draftData = (deal.draftData as Record<string, unknown>) || {};
  const intakeData = (deal.intake_data as Record<string, unknown>) || {};
  const sourceData = { ...draftData, ...intakeData };

  const sourcesBuilt: Array<{ name: string; amount: number }> = [];
  if (sourceData.equityAmount)
    sourcesBuilt.push({
      name: "Equity",
      amount: Number(sourceData.equityAmount),
    });
  if (sourceData.debtAmount)
    sourcesBuilt.push({
      name: "Senior Debt",
      amount: Number(sourceData.debtAmount),
    });
  if (sourceData.grantAmount)
    sourcesBuilt.push({
      name: "Grants / Subsidies",
      amount: Number(sourceData.grantAmount),
    });
  if (sourceData.otherAmount)
    sourcesBuilt.push({
      name: "Other Sources",
      amount: Number(sourceData.otherAmount),
    });
  // Add financing sources if array exists
  if (
    sourceData.financingSources &&
    Array.isArray(sourceData.financingSources)
  ) {
    (sourceData.financingSources as Array<Record<string, unknown>>).forEach(
      (fs) => {
        if (fs.amount)
          sourcesBuilt.push({
            name: String(fs.name || fs.type || "Other"),
            amount: Number(fs.amount),
          });
      },
    );
  }

  const normalizedProjectDescription =
    typeof deal.description === "string" ? deal.description.trim() : "";
  const normalizedSponsorDescription =
    typeof deal.sponsorDescription === "string"
      ? deal.sponsorDescription.trim()
      : "";
  const sponsorBlurb =
    normalizedSponsorDescription &&
    normalizedSponsorDescription.toLowerCase() !==
      normalizedProjectDescription.toLowerCase()
      ? normalizedSponsorDescription
      : `${deal.sponsorName} is a qualified project sponsor with experience in ${deal.programType} transactions.`;

  // Build Uses from draftData cost breakdown fields
  const usesBuilt: Array<{ name: string; amount: number }> = [];
  if (sourceData.landCost)
    usesBuilt.push({
      name: "Land Acquisition",
      amount: Number(sourceData.landCost),
    });
  if (sourceData.acquisitionCost)
    usesBuilt.push({
      name: "Acquisition",
      amount: Number(sourceData.acquisitionCost),
    });
  if (sourceData.constructionCost)
    usesBuilt.push({
      name: "Construction",
      amount: Number(sourceData.constructionCost),
    });
  if (sourceData.softCosts)
    usesBuilt.push({
      name: "Soft Costs",
      amount: Number(sourceData.softCosts),
    });
  if (sourceData.contingency)
    usesBuilt.push({
      name: "Contingency",
      amount: Number(sourceData.contingency),
    });
  if (sourceData.developerFee)
    usesBuilt.push({
      name: "Developer Fee",
      amount: Number(sourceData.developerFee),
    });
  if (sourceData.financingCosts)
    usesBuilt.push({
      name: "Financing Costs",
      amount: Number(sourceData.financingCosts),
    });
  if (sourceData.reserves)
    usesBuilt.push({ name: "Reserves", amount: Number(sourceData.reserves) });
  // Add useOfFunds if no individual fields
  if (
    usesBuilt.length === 0 &&
    deal.useOfFunds &&
    Array.isArray(deal.useOfFunds)
  ) {
    deal.useOfFunds.forEach(
      (u: { amount?: number; category?: string; name?: string }) => {
        if (u.amount)
          usesBuilt.push({
            name: u.category || u.name || "Use",
            amount: Number(u.amount),
          });
      },
    );
  }

  // Fall back to existing sources/uses if built arrays are empty
  const sources: Array<{ name: string; amount: number }> =
    sourcesBuilt.length > 0
      ? sourcesBuilt
      : (deal.sources || []).map(
          (s: { name?: string; category?: string; amount?: number }) => ({
            name: s.name || s.category || "Source",
            amount: Number(s.amount),
          }),
        );
  const uses: Array<{ name: string; amount: number }> =
    usesBuilt.length > 0
      ? usesBuilt
      : (deal.uses || []).map(
          (u: { name?: string; category?: string; amount?: number }) => ({
            name: u.name || u.category || "Use",
            amount: Number(u.amount),
          }),
        );

  // Calculate totals for Investment Summary
  const totalSources =
    sources.reduce((sum, s) => sum + (s.amount || 0), 0) ||
    deal.allocation ||
    0;
  const totalUses =
    uses.reduce((sum, u) => sum + (u.amount || 0), 0) ||
    deal.projectCost ||
    Number(sourceData?.totalProjectCost || 0) ||
    deal.allocation ||
    0;

  // Match reasons from deal data OR from latest AutoMatch run OR computed from deal characteristics
  const dealMatchReasons = (deal.matchReasons ?? []) as string[];
  const autoMatchReasons = autoMatchResults?.matches?.[0]?.reasons ?? [];

  // Generate computed highlights from deal characteristics if no stored/automatch reasons
  const computedHighlights: string[] = [];
  if (deal.tractType?.includes("SD") || deal.tractSeverelyDistressed) {
    computedHighlights.push("Severely Distressed Census Tract");
  } else if (deal.tractType?.includes("QCT") || deal.tractEligible) {
    computedHighlights.push("Qualified Census Tract");
  }
  if (deal.state) computedHighlights.push(`Located in ${deal.state}`);
  if (sourceData?.projectType || deal.programType) {
    computedHighlights.push(
      `${sourceData?.projectType || deal.programType} Project`,
    );
  }
  if (deal.shovelReady) computedHighlights.push("Shovel Ready");
  if (deal.jobsCreated && deal.jobsCreated > 0)
    computedHighlights.push(`${deal.jobsCreated} Jobs Created`);
  if (deal.povertyRate && deal.povertyRate >= 30)
    computedHighlights.push(
      `High Poverty Area (${deal.povertyRate.toFixed(0)}%)`,
    );
  if (deal.allocation && deal.allocation >= 5_000_000)
    computedHighlights.push("Large Allocation Request");

  const matchReasons =
    dealMatchReasons.length > 0
      ? dealMatchReasons
      : autoMatchReasons.length > 0
        ? autoMatchReasons
        : computedHighlights;
  const committedTotal = allocations.reduce(
    (sum, a) => sum + Number(a.amountCommitted || a.amount || 0),
    0,
  );
  const gap = Math.max((deal.allocation || 0) - committedTotal, 0);

  return (
    <>
      <main className="flex-1 bg-gray-950">
        {/* Page Header - Dark themed */}
        <div className="bg-gray-900 border-b border-gray-800">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4">
            {/* Breadcrumb */}
            <Link
              href="/deals"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors text-sm"
            >
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Marketplace
            </Link>

            {/* Header Content */}
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-bold ${colors.bg} ${colors.text} ${colors.border} border`}
                  >
                    {deal.programType}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_CONFIG[deal.status].color}`}
                  >
                    {STATUS_CONFIG[deal.status].label}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {deal.projectName}
                </h1>
                <p className="text-gray-400">
                  {deal.city}, {deal.state}
                </p>
                {deal.sponsorName && (
                  <p className="text-sm text-gray-500 mt-1">
                    Sponsor: {deal.sponsorName}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 items-center">
                {/* View Format Buttons */}
                <div className="flex gap-2 mr-4">
                  <Link
                    href={`/deals/${deal.id}/card`}
                    className="px-3 py-1.5 border border-gray-700 text-gray-400 text-sm font-medium rounded-lg hover:text-white hover:border-gray-600 transition-colors"
                  >
                    Card
                  </Link>
                  <Link
                    href={`/deals/${deal.id}/profile`}
                    className="px-3 py-1.5 border border-gray-700 text-gray-400 text-sm font-medium rounded-lg hover:text-white hover:border-gray-600 transition-colors"
                  >
                    1-Pager
                  </Link>
                  <span className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg">
                    Full
                  </span>
                </div>

                {/* Action Buttons */}
                {isOwner && (
                  <Link
                    href={`/intake?draftId=${deal.id}`}
                    className="px-4 py-2 border border-gray-700 text-gray-300 font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Edit Deal
                  </Link>
                )}
                {/* Express Interest - Only for CDEs and Investors (not sponsors viewing other deals) */}
                {isAuthenticated &&
                !isOwner &&
                (orgType === "cde" || orgType === "investor") ? (
                  <button
                    onClick={() => setShowInterestModal(true)}
                    disabled={interestSubmitted}
                    className={`px-6 py-2 font-semibold rounded-lg transition-colors ${
                      interestSubmitted
                        ? "bg-green-600 text-white cursor-default"
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    }`}
                  >
                    {interestSubmitted
                      ? "✓ Interest Submitted"
                      : "Express Interest"}
                  </button>
                ) : !isAuthenticated ? (
                  <Link
                    href="/signin"
                    className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors"
                  >
                    Sign In to Connect
                  </Link>
                ) : null}
                <button className="px-3 py-2 border border-gray-700 text-gray-400 rounded-lg hover:bg-gray-800 transition-colors">
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
                      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards Row */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Project Cost */}
            <div className="bg-gray-900/95 backdrop-blur rounded-xl border border-gray-800 p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                Project Cost
              </p>
              <p className="text-xl font-bold text-white">
                $
                {((deal.projectCost || deal.allocation * 2) / 1000000).toFixed(
                  1,
                )}
                M
              </p>
            </div>
            {/* NMTC Request */}
            <div className="bg-gray-900/95 backdrop-blur rounded-xl border border-gray-800 p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                NMTC Request
              </p>
              <p className="text-xl font-bold text-emerald-400">
                ${(deal.allocation / 1000000).toFixed(1)}M
              </p>
            </div>
            {/* Financing Gap */}
            <div className="bg-gray-900/95 backdrop-blur rounded-xl border border-gray-800 p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                Financing Gap
              </p>
              <p className="text-xl font-bold text-amber-400">
                $
                {(
                  (deal.financingGap || gap || deal.allocation * 0.39) / 1000000
                ).toFixed(1)}
                M
              </p>
            </div>
            {/* Jobs Created */}
            <div className="bg-gray-900/95 backdrop-blur rounded-xl border border-gray-800 p-4 text-center">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                Jobs Created
              </p>
              <p className="text-xl font-bold text-blue-400">
                {deal.jobsCreated || "TBD"}
              </p>
            </div>
            {/* C-Score (Form Completeness) */}
            <div
              className={`bg-gray-900/95 backdrop-blur rounded-xl border p-4 text-center ${
                completenessResult && completenessResult.percentage >= 80
                  ? "border-emerald-500/50"
                  : completenessResult && completenessResult.percentage >= 60
                    ? "border-blue-500/50"
                    : completenessResult && completenessResult.percentage >= 40
                      ? "border-amber-500/50"
                      : "border-gray-800"
              }`}
            >
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">
                C-Score
              </p>
              <p
                className={`text-xl font-bold ${
                  completenessResult && completenessResult.percentage >= 80
                    ? "text-emerald-400"
                    : completenessResult && completenessResult.percentage >= 60
                      ? "text-blue-400"
                      : completenessResult &&
                          completenessResult.percentage >= 40
                        ? "text-amber-400"
                        : "text-gray-400"
                }`}
              >
                {completenessResult
                  ? `${completenessResult.percentage}%`
                  : "N/A"}
              </p>
              {cScoreTierDisplay && (
                <p className={`text-xs mt-1 ${cScoreTierDisplay.textColor}`}>
                  {cScoreTierDisplay.label}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Match reasons & credits */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6 grid gap-4 lg:grid-cols-3">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-white mb-3">
              Match Highlights
            </h3>
            {matchReasons.length ? (
              <div className="flex flex-wrap gap-2">
                {matchReasons.slice(0, 6).map((reason, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 rounded-full bg-indigo-900/40 text-indigo-200 text-xs border border-indigo-800"
                  >
                    {reason}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Run automatch to see top reasons.
              </p>
            )}
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Credits</h3>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center justify-between">
                <span>Primary</span>
                <span className="font-medium">{deal.programType}</span>
              </div>
              {deal.stateProgram && (
                <div className="flex items-center justify-between">
                  <span>State Program</span>
                  <span className="font-medium">{deal.stateProgram}</span>
                </div>
              )}
              {deal.stateNMTCAllocation ? (
                <div className="flex items-center justify-between">
                  <span>State NMTC</span>
                  <span className="font-medium">
                    ${(deal.stateNMTCAllocation / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              ) : null}
              {deal.htcAmount ? (
                <div className="flex items-center justify-between">
                  <span>HTC Amount</span>
                  <span className="font-medium">
                    ${(deal.htcAmount / 1_000_000).toFixed(1)}M
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Allocations table */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Allocations (CDEs / Investors)
              </h3>
              <div className="text-xs text-gray-400">
                Committed: ${(committedTotal / 1_000_000).toFixed(1)}M · Gap: $
                {(gap / 1_000_000).toFixed(1)}M
              </div>
            </div>
            {allocations.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">
                No allocations added yet. Use Automatch to add.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">Org</th>
                      <th className="px-4 py-2 text-left">Program</th>
                      <th className="px-4 py-2 text-left">Year</th>
                      <th className="px-4 py-2 text-left">Committed</th>
                      <th className="px-4 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-100">
                    {allocations.map((a, idx) => (
                      <tr key={idx} className="hover:bg-gray-800/40">
                        <td className="px-4 py-2">
                          {String(a.organizationName || a.orgName || "CDE")}
                        </td>
                        <td className="px-4 py-2">
                          {String(a.program || deal.programType)}
                        </td>
                        <td className="px-4 py-2">
                          {String(a.year || a.allocationYear || "\u2014")}
                        </td>
                        <td className="px-4 py-2">
                          $
                          {(
                            Number(a.amountCommitted || a.amount || 0) /
                            1_000_000
                          ).toFixed(1)}
                          M
                        </td>
                        <td className="px-4 py-2">
                          <span className="px-2 py-0.5 rounded bg-indigo-900/40 text-indigo-200 text-xs">
                            {String(a.status || "pending")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sources and Uses */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6 grid gap-4 md:grid-cols-2">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Sources</h3>
              <span className="text-xs text-gray-400">
                {sources.length} items
              </span>
            </div>
            {sources.length === 0 ? (
              <p className="text-sm text-gray-500">No sources provided.</p>
            ) : (
              <div className="space-y-2">
                {sources.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm text-gray-200"
                  >
                    <span>{s.name}</span>
                    <span className="text-gray-100">
                      ${(Number(s.amount) / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Uses</h3>
              <span className="text-xs text-gray-400">{uses.length} items</span>
            </div>
            {uses.length === 0 ? (
              <p className="text-sm text-gray-500">No uses provided.</p>
            ) : (
              <div className="space-y-2">
                {uses.map((u, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-sm text-gray-200"
                  >
                    <span>{u.name}</span>
                    <span className="text-gray-100">
                      ${(Number(u.amount) / 1_000_000).toFixed(2)}M
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* C-Score / Completeness Score - prominent display for sponsors */}
        {isOwner && completenessResult && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6">
            <CompletenessScore
              draftData={deal.draftData}
              variant="full"
              showMissingFields={true}
            />
          </div>
        )}

        {/* Closing Checklist - shows for deals in closing or matched status */}
        {(deal.status === "closing" || deal.status === "matched") && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Closing Checklist
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {deal.programType} compliance requirements and documentation
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {deal.status === "closing" && (
                    <Link
                      href={`/closing-room/${deal.id}`}
                      className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
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
                          d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z"
                        />
                      </svg>
                      Enter Closing Room
                    </Link>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      deal.status === "closing"
                        ? "bg-teal-900/50 text-teal-300 border border-teal-500/30"
                        : "bg-purple-900/50 text-purple-300 border border-purple-500/30"
                    }`}
                  >
                    {deal.status === "closing" ? "In Closing" : "Matched"}
                  </span>
                </div>
              </div>

              <ClosingChecklist
                completedIds={
                  (deal.draftData?.checklistCompleted as number[]) || []
                }
                onToggle={async (itemId, completed) => {
                  // Update checklist state via API
                  try {
                    await fetch(`/api/deals/${deal.id}/checklist`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ itemId, completed }),
                    });
                  } catch (err) {
                    console.error("Failed to update checklist:", err);
                  }
                }}
                readOnly={!isOwner && orgType !== "cde"}
                showDocuments={true}
                program={deal.programType as "NMTC" | "HTC" | "LIHTC" | "OZ"}
              />

              {/* Quick Actions for Closing */}
              {deal.status === "closing" && isOwner && (
                <div className="mt-6 pt-4 border-t border-gray-800">
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={`/closing-room/${deal.id}?tab=documents`}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
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
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Upload Documents
                    </Link>
                    <Link
                      href={`/closing-room/${deal.id}?tab=participants`}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      View Participants
                    </Link>
                    <Link
                      href={`/closing-room/${deal.id}?tab=issues`}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                    >
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
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                      Track Issues
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lifecycle Dates (if available) */}
        {(deal.submittedAt ||
          deal.submittedDate ||
          deal.matchedAt ||
          deal.closingStartedAt) && (
          <div className="mx-auto max-w-6xl px-4 sm:px-6 mt-4">
            <div className="flex flex-wrap gap-4 text-sm">
              {(deal.submittedAt || deal.submittedDate) && (
                <div className="flex items-center gap-2 text-gray-400">
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Submitted:{" "}
                    {new Date(
                      deal.submittedAt || deal.submittedDate,
                    ).toLocaleDateString()}
                  </span>
                </div>
              )}
              {deal.matchedAt && (
                <div className="flex items-center gap-2 text-emerald-400">
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  <span>
                    Matched: {new Date(deal.matchedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {deal.closingStartedAt && (
                <div className="flex items-center gap-2 text-purple-400">
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Closing Started:{" "}
                    {new Date(deal.closingStartedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Project Images Gallery */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <ProjectImageGallery
                  projectName={deal.projectName}
                  dealId={deal.id}
                  programType={deal.programType}
                  isOwner={isOwner || false}
                  onImagesChange={async () => {
                    // Re-fetch deal so PhotoGalleryModal sees new images
                    const refreshed = await fetchDealById(id);
                    if (refreshed) setDeal(refreshed);
                  }}
                />
              </section>

              {/* Description */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Project Overview
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  {deal.description ||
                    `${deal.projectName} is a ${deal.programType} project located in ${deal.city}, ${deal.state}. This ${deal.programLevel} program opportunity has an allocation of $${(deal.allocation / 1000000).toFixed(1)}M at a credit price of $${deal.creditPrice.toFixed(2)}.`}
                </p>
              </section>

              {/* Community Impact */}
              {deal.communityImpact && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Community Impact
                  </h2>
                  <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {deal.communityImpact}
                  </p>
                </section>
              )}

              {/* Highlights */}
              {deal.projectHighlights && deal.projectHighlights.length > 0 && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Highlights
                  </h2>
                  <ul className="space-y-3">
                    {deal.projectHighlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <svg
                          className={`w-5 h-5 mt-0.5 flex-shrink-0 ${colors.text}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-gray-300">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Use of Funds */}
              {deal.useOfFunds && deal.useOfFunds.length > 0 && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Use of Funds
                  </h2>
                  <div className="space-y-4">
                    {deal.useOfFunds.map((item, idx) => {
                      const percentage = (item.amount / totalBudget) * 100;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">
                              {item.category}
                            </span>
                            <span className="text-gray-400">
                              ${(item.amount / 1000000).toFixed(2)}M (
                              {percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors.gradient}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div className="pt-3 border-t border-gray-800 flex justify-between">
                      <span className="font-semibold text-white">
                        Total Project Cost
                      </span>
                      <span className="font-semibold text-white">
                        ${(totalBudget / 1000000).toFixed(2)}M
                      </span>
                    </div>
                  </div>
                </section>
              )}

              {/* Timeline */}
              {deal.timeline && deal.timeline.length > 0 && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Timeline
                  </h2>
                  <div className="space-y-4">
                    {deal.timeline.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${item.completed ? "bg-green-900/50 text-green-400" : "bg-gray-800 text-gray-500"}`}
                        >
                          {item.completed ? (
                            <svg
                              className="w-4 h-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`font-medium ${item.completed ? "text-white" : "text-gray-400"}`}
                          >
                            {item.milestone}
                          </p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {item.date}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Sponsor */}
              <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <h2 className="text-xl font-semibold text-white mb-4">
                  About the Sponsor
                </h2>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gray-800 flex items-center justify-center text-xl font-bold text-gray-400">
                    {deal.sponsorName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">
                      {deal.sponsorName}
                    </h3>
                    <p className="text-gray-400 text-sm">{sponsorBlurb}</p>
                    {deal.website && (
                      <a
                        href={
                          deal.website.startsWith("http")
                            ? deal.website
                            : `https://${deal.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 text-sm mt-2 hover:underline block"
                      >
                        {deal.website}
                      </a>
                    )}
                    {deal.contactEmail && (
                      <a
                        href={`mailto:${deal.contactEmail}`}
                        className="text-indigo-400 text-sm mt-1 hover:underline block"
                      >
                        {deal.contactEmail}
                      </a>
                    )}
                    {deal.contactPhone && (
                      <p className="text-gray-400 text-sm mt-1">
                        {deal.contactPhone}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* Location & Census Data */}
              {(deal.address || deal.censusTract || deal.povertyRate) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Location & Census Data
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {deal.address && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Address
                        </p>
                        <p className="text-gray-200">{deal.address}</p>
                        <p className="text-gray-400">
                          {deal.city}, {deal.state} {deal.zipCode}
                        </p>
                      </div>
                    )}
                    {deal.censusTract && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Census Tract
                        </p>
                        <p className="text-gray-200 font-mono">
                          {deal.censusTract}
                        </p>
                      </div>
                    )}
                    {deal.povertyRate !== undefined && deal.povertyRate > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Poverty Rate
                        </p>
                        <p className="text-gray-200">
                          {deal.povertyRate.toFixed(1)}%
                        </p>
                      </div>
                    )}
                    {deal.medianIncome !== undefined &&
                      deal.medianIncome > 0 && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Median Income
                          </p>
                          <p className="text-gray-200">
                            {/* If value is under 200, it's MFI percentage; otherwise actual dollars */}
                            {deal.medianIncome <= 200
                              ? `${deal.medianIncome}% MFI`
                              : `$${deal.medianIncome.toLocaleString()}`}
                          </p>
                        </div>
                      )}
                    {deal.unemployment !== undefined &&
                      deal.unemployment > 0 && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Unemployment
                          </p>
                          <p className="text-gray-200">
                            {deal.unemployment.toFixed(1)}%
                          </p>
                        </div>
                      )}
                    {deal.tractType && deal.tractType.length > 0 && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Tract Type
                        </p>
                        <div className="flex gap-1 mt-1">
                          {deal.tractType.map((t) => (
                            <span
                              key={t}
                              className={`px-2 py-0.5 rounded text-xs font-medium ${colors.bg} ${colors.text}`}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Jobs & Economic Impact */}
              {Boolean(
                deal.jobsCreated ||
                deal.draftData?.permanentJobsFTE ||
                deal.draftData?.constructionJobsFTE ||
                deal.draftData?.commercialSqft ||
                deal.draftData?.housingUnits,
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Jobs & Economic Impact
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Boolean(
                      deal.jobsCreated || deal.draftData?.permanentJobsFTE,
                    ) && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">
                          {String(
                            deal.draftData?.permanentJobsFTE ||
                              deal.jobsCreated,
                          )}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Permanent Jobs (FTE)
                        </p>
                      </div>
                    )}
                    {!!deal.draftData?.constructionJobsFTE && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-400">
                          {String(deal.draftData?.constructionJobsFTE)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Construction Jobs
                        </p>
                      </div>
                    )}
                    {!!deal.draftData?.jobsRetained && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-amber-400">
                          {String(deal.draftData?.jobsRetained)}
                        </p>
                        <p className="text-gray-400 text-sm">Jobs Retained</p>
                      </div>
                    )}
                    {!!deal.draftData?.commercialSqft && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-purple-400">
                          {Number(
                            deal.draftData?.commercialSqft,
                          ).toLocaleString()}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Commercial Sq. Ft.
                        </p>
                      </div>
                    )}
                    {!!deal.draftData?.housingUnits && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-pink-400">
                          {String(deal.draftData?.housingUnits)}
                        </p>
                        <p className="text-gray-400 text-sm">Housing Units</p>
                      </div>
                    )}
                    {!!deal.draftData?.affordableHousingUnits && (
                      <div className="text-center">
                        <p className="text-3xl font-bold text-teal-400">
                          {String(deal.draftData?.affordableHousingUnits)}
                        </p>
                        <p className="text-gray-400 text-sm">
                          Affordable Units
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Financing Sources (Capital Stack) */}
              {deal.sources && deal.sources.length > 0 && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Capital Stack
                  </h2>
                  <div className="space-y-3">
                    {deal.sources.map((source, idx) => {
                      const totalSources = deal.sources!.reduce(
                        (sum, s) => sum + s.amount,
                        0,
                      );
                      const percentage =
                        totalSources > 0
                          ? (source.amount / totalSources) * 100
                          : 0;
                      return (
                        <div key={idx}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-300">{source.name}</span>
                            <span className="text-gray-400">
                              ${(source.amount / 1000000).toFixed(2)}M (
                              {percentage.toFixed(0)}%)
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Project Readiness */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.siteControl ||
                  deal.draftData?.phaseIEnvironmental ||
                  deal.draftData?.zoningApproval),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Readiness
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.siteControl) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.siteControl === "Owned" || deal.draftData?.siteControl === "Under Contract" ? "bg-green-500" : "bg-amber-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Site Control
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.siteControl)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.phaseIEnvironmental) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.phaseIEnvironmental === "Complete" ? "bg-green-500" : deal.draftData?.phaseIEnvironmental === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Phase I Environmental
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.phaseIEnvironmental)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.zoningApproval) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.zoningApproval === "Complete" ? "bg-green-500" : deal.draftData?.zoningApproval === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Zoning Approval
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.zoningApproval)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.buildingPermits) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.buildingPermits === "Complete" ? "bg-green-500" : deal.draftData?.buildingPermits === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Building Permits
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.buildingPermits)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionContract) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.constructionContract === "Yes" ? "bg-green-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Construction Contract
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.constructionContract)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Project Team */}
              {Boolean(
                deal.draftData?.projectTeam &&
                Array.isArray(deal.draftData?.projectTeam) &&
                deal.draftData?.projectTeam.length > 0,
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Team
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(
                      deal.draftData?.projectTeam as Array<{
                        role: string;
                        name?: string;
                        company?: string;
                        status?: string;
                      }>
                    ).map((member, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-400 text-sm font-bold">
                          {(member.name ||
                            member.company ||
                            "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            {member.role}
                          </p>
                          {member.name && (
                            <p className="text-gray-200">{member.name}</p>
                          )}
                          {member.company && (
                            <p className="text-gray-400 text-sm">
                              {member.company}
                            </p>
                          )}
                          {member.status && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${member.status === "Confirmed" ? "bg-green-900/50 text-green-400" : "bg-gray-700 text-gray-400"}`}
                            >
                              {member.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* NMTC-Specific: QALICB Info */}
              {Boolean(
                deal.programType === "NMTC" &&
                deal.draftData?.leverageStructure,
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    NMTC Structure
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.leverageStructure) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Leverage Structure
                        </p>
                        <p className="text-gray-200 capitalize">
                          {String(deal.draftData?.leverageStructure).replace(
                            "-",
                            " ",
                          )}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.needForNMTC) && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Need for NMTC
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {String(deal.draftData?.needForNMTC)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* HTC-Specific Info */}
              {Boolean(
                deal.programType === "HTC" &&
                deal.draftData &&
                (deal.draftData?.historicStatus || deal.draftData?.part1Status),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Historic Tax Credit Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.historicStatus) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Historic Status
                        </p>
                        <p className="text-gray-200 capitalize">
                          {String(deal.draftData?.historicStatus)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.part1Status) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Part 1 Status
                        </p>
                        <p className="text-gray-200 capitalize">
                          {String(deal.draftData?.part1Status)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.part2Status) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Part 2 Status
                        </p>
                        <p className="text-gray-200 capitalize">
                          {String(deal.draftData?.part2Status)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.qreAmount) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          QRE Amount
                        </p>
                        <p className="text-gray-200">
                          $
                          {(
                            Number(deal.draftData?.qreAmount) / 1000000
                          ).toFixed(2)}
                          M
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.htcRehabilitationScope) && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Rehabilitation Scope
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {String(deal.draftData?.htcRehabilitationScope)}
                        </p>
                      </div>
                    )}
                    {Boolean(
                      deal.draftData?.htcSecretaryStandardsCompliance,
                    ) && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Secretary&apos;s Standards Compliance
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {String(
                            deal.draftData?.htcSecretaryStandardsCompliance,
                          )}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.stateHTCState) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          State HTC
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.stateHTCState)} (
                          {String(deal.draftData?.stateHTCRate)}%)
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* LIHTC-Specific Info */}
              {Boolean(
                Array.isArray(deal.draftData?.programs) &&
                deal.draftData?.programs.includes("LIHTC") &&
                (deal.draftData?.lihtcType ||
                  deal.draftData?.totalUnits ||
                  deal.draftData?.affordableUnits),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    LIHTC Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.lihtcType) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Credit Type
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.lihtcType)} LIHTC
                        </p>
                      </div>
                    )}
                    {Boolean(
                      deal.draftData?.totalUnits ||
                      deal.draftData?.lihtcTotalUnits,
                    ) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Total Units
                        </p>
                        <p className="text-gray-200">
                          {String(
                            deal.draftData?.totalUnits ||
                              deal.draftData?.lihtcTotalUnits,
                          )}
                        </p>
                      </div>
                    )}
                    {Boolean(
                      deal.draftData?.affordableUnits ||
                      deal.draftData?.lihtcAffordableUnits,
                    ) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Affordable Units
                        </p>
                        <p className="text-gray-200">
                          {String(
                            deal.draftData?.affordableUnits ||
                              deal.draftData?.lihtcAffordableUnits,
                          )}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.amiTargets) &&
                      Array.isArray(deal.draftData?.amiTargets) && (
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            AMI Targets
                          </p>
                          <div className="flex gap-1 mt-1">
                            {(deal.draftData?.amiTargets as number[]).map(
                              (ami, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded text-xs"
                                >
                                  {ami}%
                                </span>
                              ),
                            )}
                          </div>
                        </div>
                      )}
                    {Boolean(deal.draftData?.lihtcAffordabilityLevels) && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Affordability Levels
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {String(deal.draftData?.lihtcAffordabilityLevels)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.lihtcCompliancePeriod) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Compliance Period
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.lihtcCompliancePeriod)} years
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Opportunity Zone Info */}
              {Boolean(
                Array.isArray(deal.draftData?.programs) &&
                deal.draftData?.programs.includes("OZ") &&
                (deal.draftData?.ozInvestmentDate ||
                  deal.draftData?.substantialImprovement ||
                  deal.draftData?.holdingPeriod),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Opportunity Zone Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.ozInvestmentDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Investment Date
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.ozInvestmentDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {deal.draftData?.substantialImprovement !== undefined && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Substantial Improvement
                        </p>
                        <p className="text-gray-200">
                          {deal.draftData?.substantialImprovement
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.holdingPeriod) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Holding Period
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.holdingPeriod)} years
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.ozQualifyingBasis) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Qualifying Basis
                        </p>
                        <p className="text-gray-200">
                          $
                          {(
                            Number(deal.draftData?.ozQualifyingBasis) / 1000000
                          ).toFixed(2)}
                          M
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.ozCapitalGainDeferred) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Capital Gain Deferred
                        </p>
                        <p className="text-gray-200">
                          $
                          {(
                            Number(deal.draftData?.ozCapitalGainDeferred) /
                            1000000
                          ).toFixed(2)}
                          M
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Sponsor Organization Details */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.organizationType ||
                  deal.draftData?.lowIncomeOwned ||
                  deal.draftData?.womanOwned ||
                  deal.draftData?.minorityOwned ||
                  deal.draftData?.veteranOwned),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Sponsor Organization Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.organizationType) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Organization Type
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.organizationType)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.lowIncomeOwned) &&
                      deal.draftData?.lowIncomeOwned !== "No" && (
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <p className="text-gray-200">
                            &gt;50% Low-Income Board/Ownership
                          </p>
                        </div>
                      )}
                    {deal.draftData?.womanOwned === "Yes" && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-pink-500" />
                        <p className="text-gray-200">Woman-Owned</p>
                      </div>
                    )}
                    {deal.draftData?.minorityOwned === "Yes" && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <p className="text-gray-200">Minority-Owned</p>
                      </div>
                    )}
                    {deal.draftData?.veteranOwned === "Yes" && (
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <p className="text-gray-200">Veteran-Owned</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Social Investment Criteria */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.communitySupport ||
                  deal.draftData?.longTermDevelopment ||
                  deal.draftData?.environmentalRemediation ||
                  deal.draftData?.leedCertifiable),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Social Investment Criteria
                  </h2>
                  <div className="space-y-4">
                    {Boolean(deal.draftData?.communitySupport) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Community Support
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.communitySupport)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.longTermDevelopment) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Long-Term Development Contribution
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.longTermDevelopment)}
                        </p>
                      </div>
                    )}
                    {/* Environmental */}
                    {Boolean(
                      deal.draftData?.environmentalRemediation &&
                      deal.draftData?.environmentalRemediation !== "No",
                    ) && (
                      <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-emerald-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <p className="text-emerald-300 font-medium">
                            Environmental Remediation Included
                          </p>
                        </div>
                        {Boolean(deal.draftData?.environmentalDescription) && (
                          <p className="text-gray-300 text-sm ml-7">
                            {String(deal.draftData?.environmentalDescription)}
                          </p>
                        )}
                      </div>
                    )}
                    {/* LEED / Green Building */}
                    {Boolean(
                      deal.draftData?.leedCertifiable &&
                      deal.draftData?.leedCertifiable !== "No",
                    ) && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-green-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                            />
                          </svg>
                          <p className="text-green-300 font-medium">
                            LEED Certifiable
                            {deal.draftData?.leedCertificationSought ===
                              "Yes" && " - Certification Sought"}
                            {deal.draftData?.leedLevel
                              ? ` (${String(deal.draftData?.leedLevel)})`
                              : ""}
                          </p>
                        </div>
                        {Boolean(deal.draftData?.greenFeatures) && (
                          <p className="text-gray-300 text-sm ml-7">
                            {String(deal.draftData?.greenFeatures)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Project Cost Breakdown */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.landCost ||
                  deal.draftData?.acquisitionCost ||
                  deal.draftData?.constructionCost ||
                  deal.draftData?.softCosts),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Cost Breakdown
                  </h2>
                  <div className="space-y-3">
                    {Boolean(deal.draftData?.landCost) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Land Acquisition</span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(Number(deal.draftData?.landCost) / 1000000).toFixed(
                            2,
                          )}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.acquisitionCost) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">
                          Building Acquisition
                        </span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(
                            Number(deal.draftData?.acquisitionCost) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionCost) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">
                          Construction (Hard Costs)
                        </span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(
                            Number(deal.draftData?.constructionCost) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.softCosts) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Soft Costs</span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(
                            Number(deal.draftData?.softCosts) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.contingency) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Contingency</span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(
                            Number(deal.draftData?.contingency) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.developerFee) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Developer Fee</span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(
                            Number(deal.draftData?.developerFee) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.financingCosts) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Financing Costs</span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(
                            Number(deal.draftData?.financingCosts) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.reserves) && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-gray-400">Reserves</span>
                        <span className="text-gray-200 font-medium">
                          $
                          {(Number(deal.draftData?.reserves) / 1000000).toFixed(
                            2,
                          )}
                          M
                        </span>
                      </div>
                    )}
                    {Boolean(deal.draftData?.totalProjectCost) && (
                      <div className="flex justify-between items-center pt-3 border-t-2 border-gray-700">
                        <span className="text-white font-semibold">
                          Total Project Cost
                        </span>
                        <span className="text-white font-bold text-lg">
                          $
                          {(
                            Number(deal.draftData?.totalProjectCost) / 1000000
                          ).toFixed(2)}
                          M
                        </span>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Detailed Due Diligence Status */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.phaseIIEnvironmental ||
                  deal.draftData?.geotechSoilsStudy ||
                  deal.draftData?.marketStudy ||
                  deal.draftData?.acquisitionAppraisal ||
                  deal.draftData?.asBuiltAppraisal),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Due Diligence Status
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.phaseIEnvironmental) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.phaseIEnvironmental === "Complete" ? "bg-green-500" : deal.draftData?.phaseIEnvironmental === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Phase I ESA
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.phaseIEnvironmental)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.phaseIIEnvironmental) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.phaseIIEnvironmental === "Complete" ? "bg-green-500" : deal.draftData?.phaseIIEnvironmental === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Phase II ESA
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.phaseIIEnvironmental)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.geotechSoilsStudy) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.geotechSoilsStudy === "Complete" ? "bg-green-500" : deal.draftData?.geotechSoilsStudy === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Geotech / Soils Study
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.geotechSoilsStudy)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.marketStudy) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.marketStudy === "Complete" ? "bg-green-500" : deal.draftData?.marketStudy === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Market Study
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.marketStudy)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.acquisitionAppraisal) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.acquisitionAppraisal === "Complete" ? "bg-green-500" : deal.draftData?.acquisitionAppraisal === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Acquisition Appraisal
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.acquisitionAppraisal)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.asBuiltAppraisal) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.asBuiltAppraisal === "Complete" ? "bg-green-500" : deal.draftData?.asBuiltAppraisal === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            As-Built Appraisal
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.asBuiltAppraisal)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.noFurtherActionLetter) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.noFurtherActionLetter === "Complete" ? "bg-green-500" : deal.draftData?.noFurtherActionLetter === "In Progress" ? "bg-amber-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            NFA Letter
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.noFurtherActionLetter)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Design Progress */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.schematicPlans ||
                  deal.draftData?.fullArchitecturalDrawings ||
                  deal.draftData?.constructionDrawings),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Design Progress
                  </h2>
                  <div className="space-y-4">
                    {Boolean(deal.draftData?.schematicPlans) && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">Schematic Plans</span>
                          <span
                            className={`text-sm ${deal.draftData?.schematicPlans === "Complete" ? "text-green-400" : deal.draftData?.schematicPlans === "Underway" ? "text-amber-400" : "text-gray-500"}`}
                          >
                            {String(deal.draftData?.schematicPlans)}
                            {deal.draftData?.schematicPlansPercent
                              ? ` (${deal.draftData?.schematicPlansPercent}%)`
                              : ""}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${deal.draftData?.schematicPlans === "Complete" ? "bg-green-500" : deal.draftData?.schematicPlans === "Underway" ? "bg-amber-500" : "bg-gray-600"}`}
                            style={{
                              width:
                                deal.draftData?.schematicPlans === "Complete"
                                  ? "100%"
                                  : deal.draftData?.schematicPlansPercent
                                    ? `${deal.draftData?.schematicPlansPercent}%`
                                    : deal.draftData?.schematicPlans ===
                                        "Underway"
                                      ? "50%"
                                      : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.fullArchitecturalDrawings) && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">
                            Architectural Drawings
                          </span>
                          <span
                            className={`text-sm ${deal.draftData?.fullArchitecturalDrawings === "Complete" ? "text-green-400" : deal.draftData?.fullArchitecturalDrawings === "Underway" ? "text-amber-400" : "text-gray-500"}`}
                          >
                            {String(deal.draftData?.fullArchitecturalDrawings)}
                            {deal.draftData?.architecturalDrawingsPercent
                              ? ` (${deal.draftData?.architecturalDrawingsPercent}%)`
                              : ""}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${deal.draftData?.fullArchitecturalDrawings === "Complete" ? "bg-green-500" : deal.draftData?.fullArchitecturalDrawings === "Underway" ? "bg-amber-500" : "bg-gray-600"}`}
                            style={{
                              width:
                                deal.draftData?.fullArchitecturalDrawings ===
                                "Complete"
                                  ? "100%"
                                  : deal.draftData?.architecturalDrawingsPercent
                                    ? `${deal.draftData?.architecturalDrawingsPercent}%`
                                    : deal.draftData
                                          ?.fullArchitecturalDrawings ===
                                        "Underway"
                                      ? "50%"
                                      : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionDrawings) && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-gray-300">
                            Construction Drawings
                          </span>
                          <span
                            className={`text-sm ${deal.draftData?.constructionDrawings === "Complete" ? "text-green-400" : deal.draftData?.constructionDrawings === "Underway" ? "text-amber-400" : "text-gray-500"}`}
                          >
                            {String(deal.draftData?.constructionDrawings)}
                            {deal.draftData?.constructionDrawingsPercent
                              ? ` (${deal.draftData?.constructionDrawingsPercent}%)`
                              : ""}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${deal.draftData?.constructionDrawings === "Complete" ? "bg-green-500" : deal.draftData?.constructionDrawings === "Underway" ? "bg-amber-500" : "bg-gray-600"}`}
                            style={{
                              width:
                                deal.draftData?.constructionDrawings ===
                                "Complete"
                                  ? "100%"
                                  : deal.draftData?.constructionDrawingsPercent
                                    ? `${deal.draftData?.constructionDrawingsPercent}%`
                                    : deal.draftData?.constructionDrawings ===
                                        "Underway"
                                      ? "50%"
                                      : "0%",
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Construction Contracting */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.gmpContract ||
                  deal.draftData?.paymentPerformanceBond ||
                  deal.draftData?.hardCostEstimateBasis),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Construction Contracting
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.constructionContract) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.constructionContract === "Yes" ? "bg-green-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Construction Contract
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.constructionContract)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.gmpContract) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.gmpContract === "Yes" ? "bg-green-500" : "bg-amber-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            GMP Contract
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.gmpContract)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.paymentPerformanceBond) && (
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${deal.draftData?.paymentPerformanceBond === "Yes" ? "bg-green-500" : "bg-amber-500"}`}
                        />
                        <div>
                          <p className="text-gray-500 text-xs uppercase tracking-wide">
                            Payment/Performance Bond
                          </p>
                          <p className="text-gray-200">
                            {String(deal.draftData?.paymentPerformanceBond)}
                          </p>
                        </div>
                      </div>
                    )}
                    {Boolean(deal.draftData?.hardCostEstimateBasis) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Hard Cost Estimate Basis
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.hardCostEstimateBasis)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.nonGmpExplanation) && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Non-GMP Explanation
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {String(deal.draftData?.nonGmpExplanation)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Project Timeline Details */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.constructionStartDate ||
                  deal.draftData?.projectedCompletionDate ||
                  deal.draftData?.projectedClosingDate ||
                  deal.draftData?.earliestCloseDate),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Timeline
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.siteControlDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Site Control Date
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.siteControlDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.siteControlContractExpires) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Contract Expires
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.siteControlContractExpires),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionStartDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Construction Start
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.constructionStartDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionStartMonths) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Construction Start (Months)
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.constructionStartMonths)}{" "}
                          months from closing
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.projectedCompletionDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Projected Completion
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.projectedCompletionDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.projectedClosingDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Projected Closing
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.projectedClosingDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.earliestCloseDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Earliest Close Date
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.earliestCloseDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.latestCloseDate) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Latest Close Date
                        </p>
                        <p className="text-gray-200">
                          {new Date(
                            String(deal.draftData?.latestCloseDate),
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.closingDateDriver) && (
                      <div className="col-span-2">
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Closing Date Driver
                        </p>
                        <p className="text-gray-300 text-sm mt-1">
                          {String(deal.draftData?.closingDateDriver)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* QALICB Eligibility (NMTC-specific) - Always show for NMTC deals */}
              {Boolean(
                deal.programType === "NMTC" ||
                (Array.isArray(sourceData?.programs) &&
                  sourceData?.programs.includes("NMTC")),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-white">
                      QALICB Tests
                    </h2>
                    {(() => {
                      // Use sourceData which merges intake_data and draftData
                      const grossIncome = sourceData?.qalicbGrossIncome as
                        | number
                        | undefined;
                      const tangibleProperty =
                        sourceData?.qalicbTangibleProperty as
                          | number
                          | undefined;
                      const employeeServices =
                        sourceData?.qalicbEmployeeServices as
                          | number
                          | undefined;
                      const isProhibited = sourceData?.isProhibitedBusiness as
                        | boolean
                        | undefined;
                      const testsCompleted = [
                        grossIncome !== undefined,
                        tangibleProperty !== undefined,
                        employeeServices !== undefined,
                        isProhibited !== undefined,
                      ].filter(Boolean).length;
                      const testsPassing = [
                        grossIncome !== undefined && grossIncome >= 50,
                        tangibleProperty !== undefined &&
                          tangibleProperty >= 40,
                        employeeServices !== undefined &&
                          employeeServices >= 40,
                        isProhibited === false,
                      ].filter(Boolean).length;
                      return (
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            testsCompleted === 0
                              ? "bg-gray-700 text-gray-400"
                              : testsPassing === 4
                                ? "bg-green-900/50 text-green-300 border border-green-500/30"
                                : testsPassing >= 2
                                  ? "bg-amber-900/50 text-amber-300 border border-amber-500/30"
                                  : "bg-red-900/50 text-red-300 border border-red-500/30"
                          }`}
                        >
                          {testsCompleted === 0
                            ? "Not Started"
                            : `${testsPassing}/4 Passing`}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="space-y-4">
                    {/* Test Percentages - Always show all 3 core tests */}
                    <div className="grid grid-cols-3 gap-4">
                      <div
                        className={`text-center p-4 rounded-lg ${
                          sourceData?.qalicbGrossIncome !== undefined
                            ? (sourceData?.qalicbGrossIncome as number) >= 50
                              ? "bg-green-900/30 border border-green-500/30"
                              : "bg-red-900/30 border border-red-500/30"
                            : "bg-gray-800/50"
                        }`}
                      >
                        <p
                          className={`text-2xl font-bold ${
                            sourceData?.qalicbGrossIncome !== undefined
                              ? (sourceData?.qalicbGrossIncome as number) >= 50
                                ? "text-green-400"
                                : "text-red-400"
                              : "text-gray-500"
                          }`}
                        >
                          {sourceData?.qalicbGrossIncome !== undefined
                            ? `${sourceData?.qalicbGrossIncome}%`
                            : "—"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Gross Income Test
                        </p>
                        <p className="text-gray-500 text-xs">(≥50% required)</p>
                      </div>
                      <div
                        className={`text-center p-4 rounded-lg ${
                          sourceData?.qalicbTangibleProperty !== undefined
                            ? (sourceData?.qalicbTangibleProperty as number) >=
                              40
                              ? "bg-green-900/30 border border-green-500/30"
                              : "bg-red-900/30 border border-red-500/30"
                            : "bg-gray-800/50"
                        }`}
                      >
                        <p
                          className={`text-2xl font-bold ${
                            sourceData?.qalicbTangibleProperty !== undefined
                              ? (sourceData?.qalicbTangibleProperty as number) >=
                                40
                                ? "text-green-400"
                                : "text-red-400"
                              : "text-gray-500"
                          }`}
                        >
                          {sourceData?.qalicbTangibleProperty !== undefined
                            ? `${sourceData?.qalicbTangibleProperty}%`
                            : "—"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Tangible Property Test
                        </p>
                        <p className="text-gray-500 text-xs">(≥40% required)</p>
                      </div>
                      <div
                        className={`text-center p-4 rounded-lg ${
                          sourceData?.qalicbEmployeeServices !== undefined
                            ? (sourceData?.qalicbEmployeeServices as number) >=
                              40
                              ? "bg-green-900/30 border border-green-500/30"
                              : "bg-red-900/30 border border-red-500/30"
                            : "bg-gray-800/50"
                        }`}
                      >
                        <p
                          className={`text-2xl font-bold ${
                            sourceData?.qalicbEmployeeServices !== undefined
                              ? (sourceData?.qalicbEmployeeServices as number) >=
                                40
                                ? "text-green-400"
                                : "text-red-400"
                              : "text-gray-500"
                          }`}
                        >
                          {sourceData?.qalicbEmployeeServices !== undefined
                            ? `${sourceData?.qalicbEmployeeServices}%`
                            : "—"}
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Services Test
                        </p>
                        <p className="text-gray-500 text-xs">(≥40% required)</p>
                      </div>
                    </div>

                    {/* Prohibited Business Test - Always show */}
                    <div
                      className={`p-4 rounded-lg ${
                        sourceData?.isProhibitedBusiness === undefined
                          ? "bg-gray-800/50"
                          : sourceData?.isProhibitedBusiness
                            ? "bg-red-900/30 border border-red-500/30"
                            : "bg-green-900/30 border border-green-500/30"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {sourceData?.isProhibitedBusiness === undefined ? (
                          <>
                            <svg
                              className="w-5 h-5 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span className="text-gray-400 font-medium">
                              Prohibited Business Test: Not Completed
                            </span>
                          </>
                        ) : sourceData?.isProhibitedBusiness ? (
                          <>
                            <svg
                              className="w-5 h-5 text-red-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <span className="text-red-300 font-medium">
                              Prohibited Business: Yes
                            </span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-5 h-5 text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span className="text-green-300 font-medium">
                              Not a Prohibited Business
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Additional QALICB Details */}
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      {sourceData?.intends7YrOperation !== undefined && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${sourceData?.intends7YrOperation ? "bg-green-500" : "bg-gray-500"}`}
                          />
                          <span className="text-gray-300 text-sm">
                            7-Year Operation Intent
                          </span>
                        </div>
                      )}
                      {sourceData?.currentlyGeneratingRevenue !== undefined && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${sourceData?.currentlyGeneratingRevenue ? "bg-green-500" : "bg-gray-500"}`}
                          />
                          <span className="text-gray-300 text-sm">
                            Currently Generating Revenue
                          </span>
                        </div>
                      )}
                      {sourceData?.derivesRentalIncome !== undefined && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${sourceData?.derivesRentalIncome ? "bg-blue-500" : "bg-gray-500"}`}
                          />
                          <span className="text-gray-300 text-sm">
                            Derives Rental Income
                          </span>
                        </div>
                      )}
                      {sourceData?.primarilyRentalDevelopment !== undefined && (
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${sourceData?.primarilyRentalDevelopment ? "bg-amber-500" : "bg-gray-500"}`}
                          />
                          <span className="text-gray-300 text-sm">
                            Primarily Rental Development
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Individual Team Members (if not using projectTeam array) */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.architect ||
                  deal.draftData?.generalContractor ||
                  deal.draftData?.nmtcConsultant ||
                  deal.draftData?.nmtcAttorney),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Key Team Members
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    {Boolean(deal.draftData?.architect) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Architect
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.architect)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.generalContractor) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          General Contractor
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.generalContractor)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionManager) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Construction Manager
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.constructionManager)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.ownersRepresentative) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Owner&apos;s Representative
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.ownersRepresentative)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.leasingAgent) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Leasing Agent
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.leasingAgent)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.propertyManager) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Property Manager
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.propertyManager)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.nmtcConsultant) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          NMTC Consultant
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.nmtcConsultant)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.nmtcAttorney) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          NMTC Attorney
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.nmtcAttorney)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.nmtcAccountantModeler) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          NMTC Accountant/Modeler
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.nmtcAccountantModeler)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.accountantReporting) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Accountant (Reporting)
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.accountantReporting)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.complianceReporter) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Compliance Reporter
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.complianceReporter)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.fundraiser) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Fundraiser
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.fundraiser)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Project Description Details */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.ventureType ||
                  deal.draftData?.tenantMix ||
                  deal.draftData?.needForNMTC),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Project Details
                  </h2>
                  <div className="space-y-4">
                    {Boolean(deal.draftData?.ventureType) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide">
                          Venture Type
                        </p>
                        <p className="text-gray-200">
                          {String(deal.draftData?.ventureType)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.tenantMix) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Tenant Mix
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.tenantMix)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.needForNMTC) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Need for NMTC
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.needForNMTC)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.communityBenefit) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Community Benefit
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.communityBenefit)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Jobs Details - Expanded */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.permanentJobsBasis ||
                  deal.draftData?.permanentJobsBreakdown ||
                  deal.draftData?.constructionJobsBasis ||
                  deal.draftData?.jobsValueToLIC),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Jobs Details
                  </h2>
                  <div className="space-y-4">
                    {Boolean(deal.draftData?.permanentJobsBasis) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Permanent Jobs Basis
                        </p>
                        <p className="text-gray-300 text-sm">
                          {String(deal.draftData?.permanentJobsBasis)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.permanentJobsBreakdown) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Permanent Jobs Breakdown
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.permanentJobsBreakdown)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.constructionJobsBasis) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Construction Jobs Basis
                        </p>
                        <p className="text-gray-300 text-sm">
                          {String(deal.draftData?.constructionJobsBasis)}
                        </p>
                      </div>
                    )}
                    {Boolean(deal.draftData?.jobsValueToLIC) && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Value to Low-Income Community
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.jobsValueToLIC)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* TIF/EZ District */}
              {Boolean(
                deal.draftData &&
                deal.draftData?.inTifEzDistrict &&
                deal.draftData?.inTifEzDistrict !== "No",
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    TIF/Enterprise Zone
                  </h2>
                  <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        className="w-5 h-5 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      <p className="text-indigo-300 font-medium">
                        Located in TIF/EZ District
                      </p>
                    </div>
                    {Boolean(deal.draftData?.tifEzDescription) && (
                      <p className="text-gray-300 text-sm ml-7">
                        {String(deal.draftData?.tifEzDescription)}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Financing Sources Details */}
              {Boolean(
                deal.draftData?.financingSources &&
                Array.isArray(deal.draftData?.financingSources) &&
                deal.draftData?.financingSources.length > 0,
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Financing Sources
                  </h2>
                  <div className="space-y-3">
                    {(
                      deal.draftData?.financingSources as Array<{
                        type: string;
                        source: string;
                        amount: number;
                        status: string;
                        notes?: string;
                      }>
                    ).map((fs, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              fs.type === "Equity"
                                ? "bg-emerald-900/50 text-emerald-300"
                                : fs.type === "Debt"
                                  ? "bg-blue-900/50 text-blue-300"
                                  : fs.type === "Grant"
                                    ? "bg-purple-900/50 text-purple-300"
                                    : fs.type === "Tax Credit"
                                      ? "bg-amber-900/50 text-amber-300"
                                      : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {fs.type}
                          </span>
                          <div>
                            <p className="text-gray-200">{fs.source}</p>
                            {fs.notes && (
                              <p className="text-gray-400 text-xs">
                                {fs.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-200 font-medium">
                            ${(fs.amount / 1000000).toFixed(2)}M
                          </p>
                          <span
                            className={`text-xs ${
                              fs.status === "Committed"
                                ? "text-green-400"
                                : fs.status === "Pending"
                                  ? "text-amber-400"
                                  : fs.status === "Applied"
                                    ? "text-blue-400"
                                    : "text-gray-400"
                            }`}
                          >
                            {fs.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CDE & Investor Pipeline Tracker */}
              <DealPipelineTracker dealId={deal.id} />

              {/* Site Control & Entitlements */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.siteControl ||
                  deal.draftData?.zoningApproved ||
                  deal.draftData?.entitlementsApproved),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Site Control & Entitlements
                  </h2>
                  <div className="space-y-4">
                    {/* Site Control Status */}
                    {Boolean(deal.draftData?.siteControl) && (
                      <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              deal.draftData?.siteControl === "Owned"
                                ? "bg-green-900/50"
                                : deal.draftData?.siteControl ===
                                    "Under Contract"
                                  ? "bg-blue-900/50"
                                  : deal.draftData?.siteControl === "LOI"
                                    ? "bg-amber-900/50"
                                    : "bg-gray-700"
                            }`}
                          >
                            <svg
                              className={`w-5 h-5 ${
                                deal.draftData?.siteControl === "Owned"
                                  ? "text-green-400"
                                  : deal.draftData?.siteControl ===
                                      "Under Contract"
                                    ? "text-blue-400"
                                    : deal.draftData?.siteControl === "LOI"
                                      ? "text-amber-400"
                                      : "text-gray-400"
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                              />
                            </svg>
                          </div>
                          <div>
                            <p className="text-gray-400 text-xs uppercase tracking-wide">
                              Site Control
                            </p>
                            <p
                              className={`font-medium ${
                                deal.draftData?.siteControl === "Owned"
                                  ? "text-green-400"
                                  : deal.draftData?.siteControl ===
                                      "Under Contract"
                                    ? "text-blue-400"
                                    : deal.draftData?.siteControl === "LOI"
                                      ? "text-amber-400"
                                      : "text-gray-300"
                              }`}
                            >
                              {String(deal.draftData?.siteControl)}
                            </p>
                          </div>
                        </div>
                        {deal.draftData?.siteControlDate && (
                          <div className="text-right">
                            <p className="text-gray-500 text-xs">Date</p>
                            <p className="text-gray-300 text-sm">
                              {new Date(
                                String(deal.draftData?.siteControlDate),
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Contract Expiration */}
                    {deal.draftData?.siteControl === "Under Contract" &&
                      deal.draftData?.contractExpiration && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                          <svg
                            className="w-4 h-4 text-amber-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-amber-300 text-sm">
                            Contract expires:{" "}
                            {new Date(
                              String(deal.draftData?.contractExpiration),
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      )}

                    {/* Zoning & Entitlements Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div
                        className={`p-3 rounded-lg border ${deal.draftData?.zoningApproved ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                      >
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Zoning
                        </p>
                        <div className="flex items-center gap-2">
                          {deal.draftData?.zoningApproved ? (
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          <span
                            className={
                              deal.draftData?.zoningApproved
                                ? "text-green-400 text-sm"
                                : "text-gray-400 text-sm"
                            }
                          >
                            {deal.draftData?.zoningApproved
                              ? "Approved"
                              : "Pending"}
                          </span>
                        </div>
                      </div>

                      <div
                        className={`p-3 rounded-lg border ${deal.draftData?.entitlementsApproved ? "bg-green-900/20 border-green-500/30" : deal.draftData?.entitlementsSubmitted ? "bg-blue-900/20 border-blue-500/30" : deal.draftData?.entitlementsStarted ? "bg-amber-900/20 border-amber-500/30" : "bg-gray-800/50 border-gray-700"}`}
                      >
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Entitlements
                        </p>
                        <div className="flex items-center gap-2">
                          {deal.draftData?.entitlementsApproved ? (
                            <svg
                              className="w-4 h-4 text-green-400"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          ) : deal.draftData?.entitlementsSubmitted ? (
                            <svg
                              className="w-4 h-4 text-blue-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-4 h-4 text-gray-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                          <span
                            className={`text-sm ${deal.draftData?.entitlementsApproved ? "text-green-400" : deal.draftData?.entitlementsSubmitted ? "text-blue-400" : deal.draftData?.entitlementsStarted ? "text-amber-400" : "text-gray-400"}`}
                          >
                            {deal.draftData?.entitlementsApproved
                              ? "Approved"
                              : deal.draftData?.entitlementsSubmitted
                                ? "Submitted"
                                : deal.draftData?.entitlementsStarted
                                  ? "In Progress"
                                  : "Not Started"}
                          </span>
                        </div>
                      </div>

                      {deal.draftData?.zoningApproval && (
                        <div
                          className={`p-3 rounded-lg border ${deal.draftData?.zoningApproval === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                        >
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                            Zoning Approval
                          </p>
                          <span
                            className={`text-sm ${deal.draftData?.zoningApproval === "Complete" ? "text-green-400" : "text-gray-400"}`}
                          >
                            {String(deal.draftData?.zoningApproval)}
                          </span>
                        </div>
                      )}

                      {deal.draftData?.buildingPermits && (
                        <div
                          className={`p-3 rounded-lg border ${deal.draftData?.buildingPermits === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                        >
                          <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                            Building Permits
                          </p>
                          <span
                            className={`text-sm ${deal.draftData?.buildingPermits === "Complete" ? "text-green-400" : "text-gray-400"}`}
                          >
                            {String(deal.draftData?.buildingPermits)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Due Diligence Progress */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.phaseIEnvironmental ||
                  deal.draftData?.phaseIIEnvironmental ||
                  deal.draftData?.marketStudy ||
                  deal.draftData?.acquisitionAppraisal ||
                  deal.draftData?.schematicPlans ||
                  deal.draftData?.constructionDrawings),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Due Diligence Progress
                  </h2>
                  <div className="space-y-4">
                    {/* Environmental Studies */}
                    {(deal.draftData?.phaseIEnvironmental ||
                      deal.draftData?.phaseIIEnvironmental) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <span className="text-lg">🌍</span> Environmental
                          Studies
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                          {deal.draftData?.phaseIEnvironmental && (
                            <div
                              className={`p-3 rounded-lg border ${deal.draftData?.phaseIEnvironmental === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                            >
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                Phase I
                              </p>
                              <p
                                className={`text-sm font-medium ${deal.draftData?.phaseIEnvironmental === "Complete" ? "text-green-400" : "text-gray-300"}`}
                              >
                                {String(deal.draftData?.phaseIEnvironmental)}
                              </p>
                              {deal.draftData?.phaseIEnvironmentalDate && (
                                <p className="text-gray-500 text-xs mt-1">
                                  {new Date(
                                    String(
                                      deal.draftData?.phaseIEnvironmentalDate,
                                    ),
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                          {deal.draftData?.phaseIIEnvironmental && (
                            <div
                              className={`p-3 rounded-lg border ${deal.draftData?.phaseIIEnvironmental === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                            >
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                Phase II
                              </p>
                              <p
                                className={`text-sm font-medium ${deal.draftData?.phaseIIEnvironmental === "Complete" ? "text-green-400" : "text-gray-300"}`}
                              >
                                {String(deal.draftData?.phaseIIEnvironmental)}
                              </p>
                              {deal.draftData?.phaseIIEnvironmentalDate && (
                                <p className="text-gray-500 text-xs mt-1">
                                  {new Date(
                                    String(
                                      deal.draftData?.phaseIIEnvironmentalDate,
                                    ),
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Appraisals & Market Studies */}
                    {(deal.draftData?.marketStudy ||
                      deal.draftData?.acquisitionAppraisal ||
                      deal.draftData?.asBuiltAppraisal) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <span className="text-lg">📊</span> Appraisals &
                          Studies
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {deal.draftData?.marketStudy && (
                            <div
                              className={`p-3 rounded-lg border ${deal.draftData?.marketStudy === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                            >
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                Market Study
                              </p>
                              <p
                                className={`text-sm font-medium ${deal.draftData?.marketStudy === "Complete" ? "text-green-400" : "text-gray-300"}`}
                              >
                                {String(deal.draftData?.marketStudy)}
                              </p>
                            </div>
                          )}
                          {deal.draftData?.acquisitionAppraisal && (
                            <div
                              className={`p-3 rounded-lg border ${deal.draftData?.acquisitionAppraisal === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                            >
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                Acquisition Appraisal
                              </p>
                              <p
                                className={`text-sm font-medium ${deal.draftData?.acquisitionAppraisal === "Complete" ? "text-green-400" : "text-gray-300"}`}
                              >
                                {String(deal.draftData?.acquisitionAppraisal)}
                              </p>
                            </div>
                          )}
                          {deal.draftData?.asBuiltAppraisal && (
                            <div
                              className={`p-3 rounded-lg border ${deal.draftData?.asBuiltAppraisal === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                            >
                              <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                                As-Built Appraisal
                              </p>
                              <p
                                className={`text-sm font-medium ${deal.draftData?.asBuiltAppraisal === "Complete" ? "text-green-400" : "text-gray-300"}`}
                              >
                                {String(deal.draftData?.asBuiltAppraisal)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Design Progress */}
                    {(deal.draftData?.schematicPlans ||
                      deal.draftData?.fullArchitecturalDrawings ||
                      deal.draftData?.constructionDrawings) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                          <span className="text-lg">📐</span> Design Progress
                        </h3>
                        <div className="space-y-2">
                          {deal.draftData?.schematicPlans && (
                            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                              <span className="text-gray-300 text-sm">
                                Schematic Plans
                              </span>
                              <div className="flex items-center gap-3">
                                {deal.draftData?.schematicPlansPercent !==
                                  undefined && (
                                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500"
                                      style={{
                                        width: `${Number(deal.draftData?.schematicPlansPercent)}%`,
                                      }}
                                    />
                                  </div>
                                )}
                                <span
                                  className={`text-sm font-medium ${deal.draftData?.schematicPlans === "Complete" ? "text-green-400" : "text-gray-400"}`}
                                >
                                  {String(deal.draftData?.schematicPlans)}
                                </span>
                              </div>
                            </div>
                          )}
                          {deal.draftData?.fullArchitecturalDrawings && (
                            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                              <span className="text-gray-300 text-sm">
                                Architectural Drawings
                              </span>
                              <div className="flex items-center gap-3">
                                {deal.draftData
                                  ?.architecturalDrawingsPercent !==
                                  undefined && (
                                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500"
                                      style={{
                                        width: `${Number(deal.draftData?.architecturalDrawingsPercent)}%`,
                                      }}
                                    />
                                  </div>
                                )}
                                <span
                                  className={`text-sm font-medium ${deal.draftData?.fullArchitecturalDrawings === "Complete" ? "text-green-400" : "text-gray-400"}`}
                                >
                                  {String(
                                    deal.draftData?.fullArchitecturalDrawings,
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                          {deal.draftData?.constructionDrawings && (
                            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                              <span className="text-gray-300 text-sm">
                                Construction Drawings
                              </span>
                              <div className="flex items-center gap-3">
                                {deal.draftData?.constructionDrawingsPercent !==
                                  undefined && (
                                  <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-indigo-500"
                                      style={{
                                        width: `${Number(deal.draftData?.constructionDrawingsPercent)}%`,
                                      }}
                                    />
                                  </div>
                                )}
                                <span
                                  className={`text-sm font-medium ${deal.draftData?.constructionDrawings === "Complete" ? "text-green-400" : "text-gray-400"}`}
                                >
                                  {String(deal.draftData?.constructionDrawings)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Geotechnical */}
                    {deal.draftData?.geotechSoilsStudy && (
                      <div
                        className={`p-3 rounded-lg border ${deal.draftData?.geotechSoilsStudy === "Complete" ? "bg-green-900/20 border-green-500/30" : "bg-gray-800/50 border-gray-700"}`}
                      >
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Geotechnical/Soils Study
                        </p>
                        <p
                          className={`text-sm font-medium ${deal.draftData?.geotechSoilsStudy === "Complete" ? "text-green-400" : "text-gray-300"}`}
                        >
                          {String(deal.draftData?.geotechSoilsStudy)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Social Impact & Environmental */}
              {Boolean(
                deal.draftData &&
                (deal.draftData?.communitySupport ||
                  deal.draftData?.longTermDevelopment ||
                  deal.draftData?.environmentalRemediation ||
                  deal.draftData?.leedCertifiable ||
                  deal.draftData?.leedCertificationSought ||
                  deal.draftData?.greenFeatures),
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Social Impact & Sustainability
                  </h2>
                  <div className="space-y-4">
                    {/* Community Support */}
                    {deal.draftData?.communitySupport && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Community Support
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.communitySupport)}
                        </p>
                      </div>
                    )}

                    {/* Long-term Development */}
                    {deal.draftData?.longTermDevelopment && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Sustainable Development Contribution
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.longTermDevelopment)}
                        </p>
                      </div>
                    )}

                    {/* Impact Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {deal.draftData?.communitySupport && (
                        <span className="px-3 py-1 bg-emerald-900/50 text-emerald-300 rounded-full text-xs font-medium flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Community Support
                        </span>
                      )}
                      {deal.draftData?.environmentalRemediation === "Yes" && (
                        <span className="px-3 py-1 bg-purple-900/50 text-purple-300 rounded-full text-xs font-medium flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Environmental Remediation
                        </span>
                      )}
                      {deal.draftData?.leedCertificationSought === "Yes" && (
                        <span className="px-3 py-1 bg-green-900/50 text-green-300 rounded-full text-xs font-medium flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          LEED {deal.draftData?.leedLevel || "Certification"}
                        </span>
                      )}
                      {deal.draftData?.greenFeatures && (
                        <span className="px-3 py-1 bg-teal-900/50 text-teal-300 rounded-full text-xs font-medium flex items-center gap-1">
                          <svg
                            className="w-3 h-3"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Green Features
                        </span>
                      )}
                    </div>

                    {/* Environmental Remediation Details */}
                    {deal.draftData?.environmentalRemediation === "Yes" &&
                      deal.draftData?.environmentalDescription && (
                        <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                          <p className="text-purple-300 font-medium text-sm mb-1">
                            Environmental Remediation Details
                          </p>
                          <p className="text-gray-300 text-sm">
                            {String(deal.draftData?.environmentalDescription)}
                          </p>
                        </div>
                      )}

                    {/* LEED Details */}
                    {deal.draftData?.leedCertificationSought === "Yes" &&
                      deal.draftData?.leedLevel && (
                        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                          <p className="text-green-300 font-medium text-sm mb-1">
                            LEED Certification Target
                          </p>
                          <span
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              deal.draftData?.leedLevel === "Platinum"
                                ? "bg-indigo-600 text-white"
                                : deal.draftData?.leedLevel === "Gold"
                                  ? "bg-yellow-600 text-white"
                                  : deal.draftData?.leedLevel === "Silver"
                                    ? "bg-gray-400 text-gray-900"
                                    : "bg-green-600 text-white"
                            }`}
                          >
                            {String(deal.draftData?.leedLevel)}
                          </span>
                        </div>
                      )}

                    {/* Green Features */}
                    {deal.draftData?.greenFeatures && (
                      <div>
                        <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">
                          Green Building Features
                        </p>
                        <p className="text-gray-300 text-sm whitespace-pre-line">
                          {String(deal.draftData?.greenFeatures)}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Documents */}
              {Boolean(
                deal.draftData?.documents &&
                Array.isArray(deal.draftData?.documents) &&
                deal.draftData?.documents.length > 0,
              ) && (
                <section className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h2 className="text-xl font-semibold text-white mb-4">
                    Due Diligence Documents
                  </h2>
                  <div className="space-y-2">
                    {(
                      deal.draftData?.documents as Array<{
                        id: string;
                        name: string;
                        category: string;
                        mimeType: string;
                        size: number;
                        status: string;
                        uploadedAt: string;
                      }>
                    ).map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">
                            {doc.mimeType?.includes("pdf")
                              ? "📕"
                              : doc.mimeType?.includes("image")
                                ? "🖼️"
                                : doc.mimeType?.includes("spreadsheet") ||
                                    doc.mimeType?.includes("excel")
                                  ? "📊"
                                  : doc.mimeType?.includes("document") ||
                                      doc.mimeType?.includes("word")
                                    ? "📝"
                                    : "📄"}
                          </span>
                          <div>
                            <p className="text-gray-200 text-sm font-medium">
                              {doc.name}
                            </p>
                            <p className="text-gray-500 text-xs">
                              {doc.category && (
                                <span className="capitalize">
                                  {doc.category.replace("_", " ")}
                                </span>
                              )}
                              {doc.size && (
                                <span>
                                  {" "}
                                  •{" "}
                                  {doc.size < 1024 * 1024
                                    ? `${(doc.size / 1024).toFixed(0)} KB`
                                    : `${(doc.size / (1024 * 1024)).toFixed(1)} MB`}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            doc.status === "approved"
                              ? "bg-green-900/50 text-green-300"
                              : doc.status === "rejected"
                                ? "bg-red-900/50 text-red-300"
                                : doc.status === "needs_review"
                                  ? "bg-yellow-900/50 text-yellow-300"
                                  : "bg-gray-700 text-gray-400"
                          }`}
                        >
                          {doc.status === "approved"
                            ? "Approved"
                            : doc.status === "rejected"
                              ? "Rejected"
                              : doc.status === "needs_review"
                                ? "Review"
                                : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                  {deal.draftData?.docsUploaded !== undefined &&
                    deal.draftData?.docsRequired !== undefined && (
                      <div className="mt-4 pt-4 border-t border-gray-800">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">
                            Document Completion
                          </span>
                          <span className="text-gray-200 font-medium">
                            {Number(deal.draftData?.docsUploaded)} /{" "}
                            {Number(deal.draftData?.docsRequired)} required
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{
                              width: `${Math.min(100, (Number(deal.draftData?.docsUploaded) / Math.max(1, Number(deal.draftData?.docsRequired))) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                </section>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Investment Summary - Matches Project Profile Sidebar */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-700 pb-3">
                  Investment Summary
                </h3>

                <div className="space-y-3 text-sm">
                  {/* Sponsor */}
                  <div className="border-b border-gray-800/50 pb-2">
                    <span className="text-gray-500 block text-xs font-medium">
                      Sponsor Organization
                    </span>
                    <span className="text-white">
                      {deal.sponsorName || "—"}
                    </span>
                  </div>

                  {/* Location */}
                  <div className="border-b border-gray-800/50 pb-2">
                    <span className="text-gray-500 block text-xs font-medium">
                      Location
                    </span>
                    {deal.address && (
                      <span className="text-white block">{deal.address}</span>
                    )}
                    <span className="text-white">
                      {deal.city}, {deal.state}
                    </span>
                  </div>

                  {/* Census Tract */}
                  <div className="border-b border-gray-800/50 pb-2">
                    <span className="text-gray-500 block text-xs font-medium">
                      Census Tract
                    </span>
                    <span className="text-white font-mono text-xs">
                      {String(
                        deal.censusTract || sourceData?.censusTract || "\u2014",
                      )}
                    </span>
                  </div>

                  {/* Census Tract Data */}
                  <div className="border-b border-gray-800/50 pb-2">
                    <span className="text-gray-500 block text-xs font-medium underline mb-1">
                      Census Tract Data
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span className="text-emerald-400 font-bold block">
                          {deal.povertyRate || "\u2014"}%
                        </span>
                        <span className="text-gray-500 text-xs">Poverty</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold block">
                          {String(
                            deal.medianIncome ||
                              sourceData?.tractMedianIncome ||
                              "\u2014",
                          )}
                          %
                        </span>
                        <span className="text-gray-500 text-xs">MFI</span>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold block">
                          {String(
                            deal.unemployment ||
                              sourceData?.tractUnemployment ||
                              "\u2014",
                          )}
                          %
                        </span>
                        <span className="text-gray-500 text-xs">Unemp.</span>
                      </div>
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="border-b border-gray-800/50 pb-2">
                    <span className="text-gray-500 block text-xs font-medium">
                      Total Project Cost
                    </span>
                    <span className="text-cyan-400 font-bold text-lg">
                      $
                      {(
                        Number(
                          deal.projectCost || sourceData?.totalProjectCost || 0,
                        ) / 1000000
                      ).toFixed(1)}
                      M
                    </span>
                  </div>

                  <div className="border-b border-gray-800/50 pb-2">
                    <span className="text-gray-500 block text-xs font-medium">
                      Fed NMTC Request
                    </span>
                    <span className="text-emerald-400 font-bold text-lg">
                      $
                      {(
                        Number(
                          deal.allocation ||
                            sourceData?.nmtcFinancingRequested ||
                            0,
                        ) / 1000000
                      ).toFixed(1)}
                      M
                    </span>
                  </div>

                  {!!(
                    sourceData?.stateNmtcAllocation ||
                    sourceData?.stateNMTCAllocation
                  ) && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium">
                        State NMTC Request
                      </span>
                      <span className="text-emerald-400 font-bold">
                        $
                        {(
                          Number(
                            sourceData?.stateNmtcAllocation ||
                              sourceData?.stateNMTCAllocation ||
                              0,
                          ) / 1000000
                        ).toFixed(1)}
                        M
                      </span>
                    </div>
                  )}

                  {!!(sourceData?.htcAmount || sourceData?.qreAmount) && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium">
                        Total HTC
                      </span>
                      <span className="text-blue-400 font-bold">
                        $
                        {(
                          Number(
                            sourceData?.htcAmount || sourceData?.qreAmount || 0,
                          ) / 1000000
                        ).toFixed(1)}
                        M
                      </span>
                    </div>
                  )}

                  {/* Shovel Ready */}
                  <div
                    className={`py-2 px-3 rounded text-center font-bold text-xs uppercase ${
                      deal.shovelReady !== false
                        ? "bg-green-900/30 text-green-400 border border-green-500/30"
                        : "bg-amber-900/30 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    Shovel Ready: {deal.shovelReady !== false ? "YES" : "NO"}
                  </div>

                  {/* Financing Gap */}
                  {!!(deal.financingGap || sourceData?.financingGap) && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium">
                        Financing Gap
                      </span>
                      <span className="text-orange-400 font-bold">
                        $
                        {(
                          Number(
                            deal.financingGap || sourceData?.financingGap || 0,
                          ) / 1000000
                        ).toFixed(1)}
                        M
                      </span>
                    </div>
                  )}

                  {/* Completion Date */}
                  {!!(
                    deal.completionDate || sourceData?.projectedCompletionDate
                  ) && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium">
                        Projected Completion
                      </span>
                      <span className="text-white">
                        {String(
                          deal.completionDate ||
                            sourceData?.projectedCompletionDate,
                        )}
                      </span>
                    </div>
                  )}

                  {/* Sources */}
                  {sources.length > 0 && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium underline mb-1">
                        Sources
                      </span>
                      <div className="text-gray-300 text-xs">
                        {sources.slice(0, 4).map((s, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{s.name}</span>
                            <span>${(s.amount / 1000000).toFixed(1)}M</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-white border-t border-gray-700 mt-1 pt-1">
                          <span>Total:</span>
                          <span>${(totalSources / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Uses */}
                  {uses.length > 0 && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium underline mb-1">
                        Uses
                      </span>
                      <div className="text-gray-300 text-xs">
                        {uses.slice(0, 4).map((u, i) => (
                          <div key={i} className="flex justify-between">
                            <span>{u.name}</span>
                            <span>${(u.amount / 1000000).toFixed(1)}M</span>
                          </div>
                        ))}
                        <div className="flex justify-between font-bold text-white border-t border-gray-700 mt-1 pt-1">
                          <span>Total:</span>
                          <span>${(totalUses / 1000000).toFixed(1)}M</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Jobs Created */}
                  {!!(deal.jobsCreated || sourceData?.permanentJobsFTE) && (
                    <div className="border-b border-gray-800/50 pb-2">
                      <span className="text-gray-500 block text-xs font-medium">
                        Jobs Created
                      </span>
                      <span className="text-white font-bold">
                        {String(
                          deal.jobsCreated || sourceData?.permanentJobsFTE,
                        )}
                      </span>
                    </div>
                  )}

                  {/* Project Number */}
                  <div className="pt-2">
                    <span className="text-gray-500 block text-xs font-medium">
                      Project Number
                    </span>
                    <span className="text-gray-400 text-xs font-mono">
                      tcredex.com_{new Date().getFullYear()}-
                      {deal.id?.slice(-4) || "0000"}
                    </span>
                  </div>
                </div>

                {/* Action Panel - Role-based buttons */}
                <div className="mt-6">
                  <DealActionPanel
                    deal={deal}
                    dealId={id}
                    isOwner={isOwner}
                    orgType={orgType || ""}
                    isAuthenticated={isAuthenticated}
                    interestSubmitted={interestSubmitted}
                    onOpenModal={openActionModal}
                    onViewPhotos={() => setShowPhotoGallery(true)}
                    onSelectFeaturedImage={() => {
                      setSelectingFeaturedImage(true);
                      setShowPhotoGallery(true);
                    }}
                    onRunAutoMatch={runAutoMatch}
                    autoMatchLoading={autoMatchLoading}
                  />
                </div>
              </div>

              {/* Capital Stack - Funding Sources */}
              {isOwner && (
                <CapitalStack
                  dealId={id}
                  isOwner={isOwner}
                  onRunAutoMatch={runAutoMatch}
                  autoMatchLoading={autoMatchLoading}
                />
              )}

              {/* AutoMatch Results Card */}
              {isOwner && (autoMatchResults || autoMatchError) && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      CDE Matches
                    </h3>
                    {autoMatchResults && (
                      <span className="text-xs text-gray-500">
                        {new Date(
                          autoMatchResults.timestamp,
                        ).toLocaleTimeString()}
                      </span>
                    )}
                  </div>

                  {autoMatchError && (
                    <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
                      <p className="text-sm text-red-300">{autoMatchError}</p>
                    </div>
                  )}

                  {autoMatchResults &&
                    autoMatchResults.matches.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-gray-400">No matching CDEs found</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Try updating your deal details to improve match
                          potential
                        </p>
                      </div>
                    )}

                  {autoMatchResults && autoMatchResults.matches.length > 0 && (
                    <div className="space-y-3">
                      {autoMatchResults.matches
                        .slice(0, 5)
                        .map((match, idx) => (
                          <div
                            key={match.cdeId}
                            className={`p-3 rounded-lg border transition-colors ${
                              match.matchStrength === "excellent"
                                ? "bg-emerald-900/20 border-emerald-500/30"
                                : match.matchStrength === "good"
                                  ? "bg-blue-900/20 border-blue-500/30"
                                  : match.matchStrength === "fair"
                                    ? "bg-amber-900/20 border-amber-500/30"
                                    : "bg-gray-800/50 border-gray-700"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">
                                    #{idx + 1}
                                  </span>
                                  <span className="font-medium text-white truncate">
                                    {match.cdeName}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.reasons
                                    .slice(0, 2)
                                    .map((reason, i) => (
                                      <span
                                        key={i}
                                        className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-300 rounded"
                                      >
                                        {reason}
                                      </span>
                                    ))}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <div
                                  className={`text-lg font-bold ${
                                    match.matchStrength === "excellent"
                                      ? "text-emerald-400"
                                      : match.matchStrength === "good"
                                        ? "text-blue-400"
                                        : match.matchStrength === "fair"
                                          ? "text-amber-400"
                                          : "text-gray-400"
                                  }`}
                                >
                                  {match.totalScore}
                                </div>
                                <div
                                  className={`text-xs capitalize ${
                                    match.matchStrength === "excellent"
                                      ? "text-emerald-500"
                                      : match.matchStrength === "good"
                                        ? "text-blue-500"
                                        : match.matchStrength === "fair"
                                          ? "text-amber-500"
                                          : "text-gray-500"
                                  }`}
                                >
                                  {match.matchStrength}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}

                      {autoMatchResults.matches.length > 5 && (
                        <p className="text-center text-xs text-gray-500 pt-2">
                          +{autoMatchResults.matches.length - 5} more matches
                        </p>
                      )}

                      <button
                        onClick={() => setShowInterestModal(true)}
                        className="w-full mt-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-center text-sm font-medium rounded-lg transition-colors"
                      >
                        Contact Top Matches
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Photo Gallery Modal */}
      {showPhotoGallery && (
        <PhotoGalleryModal
          isOpen={true}
          onClose={() => {
            setShowPhotoGallery(false);
            setSelectingFeaturedImage(false);
          }}
          images={deal.projectImages || []}
          featuredImageId={deal.featuredImageId}
          isOwner={isOwner}
          onSelectFeatured={async (imageId: string) => {
            try {
              await fetch(`/api/deals/${id}/featured-image`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ imageId }),
              });
              // Refresh deal to show updated featured image
              const refreshedDeal = await fetchDealById(id);
              if (refreshedDeal) setDeal(refreshedDeal);
            } catch (err) {
              console.error("Failed to set featured image:", err);
            }
            setShowPhotoGallery(false);
            setSelectingFeaturedImage(false);
          }}
          projectName={deal.projectName}
        />
      )}

      {/* New Role-Based Action Modals */}
      <DealActionModals
        deal={deal}
        orgType={orgType || "investor"}
        orgName={orgName || "Guest"}
        userName={userName || "User"}
        organizationId={organizationId || ""}
        isOwner={isOwner || false}
        showModal={showActionModal}
        modalType={activeModal}
        onClose={() => {
          setShowActionModal(false);
          setActiveModal(null);
        }}
        onSubmit={handleActionSubmit}
      />

      {/* Express Interest Modal - Role-Aware */}
      {showInterestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowInterestModal(false)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
            {isOwner ? (
              /* SPONSOR VIEW - Contact CDEs/Investors */
              <>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Contact CDEs & Investors
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Reach out to potential partners for {deal.projectName}
                </p>

                <div className="space-y-4">
                  {/* Contact type checkboxes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Who would you like to contact?
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactCDEs}
                          onChange={(e) => setContactCDEs(e.target.checked)}
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-200">CDEs</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={contactInvestors}
                          onChange={(e) =>
                            setContactInvestors(e.target.checked)
                          }
                          className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-gray-200">Investors</span>
                      </label>
                    </div>
                  </div>

                  {/* Recipient selection - populated from API */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Select Recipients{" "}
                      <span className="text-gray-500">
                        (matched partners shown first)
                      </span>
                    </label>

                    {outreachError && (
                      <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3 mb-3">
                        <p className="text-sm text-red-300">{outreachError}</p>
                      </div>
                    )}

                    {!contactCDEs && !contactInvestors ? (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
                        <p className="text-gray-400 text-sm">
                          Select at least one contact type above
                        </p>
                      </div>
                    ) : outreachLoading ? (
                      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 text-center">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">
                          Loading available partners...
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-800/50 rounded-lg border border-gray-700 max-h-64 overflow-y-auto">
                        {getAvailableRecipients().length === 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-gray-400 text-sm">
                              No available partners found
                            </p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-700">
                            {getAvailableRecipients().map((recipient) => {
                              const recipientKey = getRecipientKey(recipient);
                              const isSelected =
                                selectedRecipients.includes(recipientKey);
                              const isCDE = "missionStatement" in recipient;
                              const typeLabel = isCDE ? "CDE" : "Investor";
                              const limit = isCDE
                                ? outreachData?.limits.cde
                                : outreachData?.limits.investor;
                              const selectedOfType = selectedRecipients.filter(
                                (id) =>
                                  isCDE
                                    ? outreachData?.cdes?.some(
                                        (c) => getRecipientKey(c) === id,
                                      )
                                    : outreachData?.investors?.some(
                                        (i) => getRecipientKey(i) === id,
                                      ),
                              ).length;
                              const atLimit =
                                !isSelected &&
                                limit !== undefined &&
                                selectedOfType >= limit;

                              return (
                                <label
                                  key={recipientKey}
                                  className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
                                    recipient.isContacted
                                      ? "opacity-50 cursor-not-allowed bg-gray-800/30"
                                      : atLimit
                                        ? "opacity-50 cursor-not-allowed"
                                        : isSelected
                                          ? "bg-indigo-900/30"
                                          : "hover:bg-gray-800/50"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() =>
                                      !recipient.isContacted &&
                                      !atLimit &&
                                      toggleRecipient(recipientKey)
                                    }
                                    disabled={recipient.isContacted || atLimit}
                                    className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-200 truncate">
                                        {recipient.name}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 text-xs rounded ${
                                          isCDE
                                            ? "bg-emerald-900/50 text-emerald-300"
                                            : "bg-purple-900/50 text-purple-300"
                                        }`}
                                      >
                                        {typeLabel}
                                      </span>
                                      {recipient.matchScore > 50 && (
                                        <span className="px-1.5 py-0.5 text-xs bg-amber-900/50 text-amber-300 rounded">
                                          Match
                                        </span>
                                      )}
                                      {!recipient.isSystemUser && (
                                        <span className="px-1.5 py-0.5 text-xs bg-gray-700 text-gray-400 rounded">
                                          Email only
                                        </span>
                                      )}
                                    </div>
                                    {recipient.isContacted && (
                                      <p className="text-xs text-amber-400 mt-0.5">
                                        Already contacted
                                      </p>
                                    )}
                                    {isCDE &&
                                      recipient.allocationAvailable &&
                                      recipient.allocationAvailable > 0 && (
                                        <p className="text-xs text-gray-400 mt-0.5">
                                          $
                                          {(
                                            recipient.allocationAvailable /
                                            1000000
                                          ).toFixed(1)}
                                          M available
                                        </p>
                                      )}
                                    {!isCDE && recipient.programs && (
                                      <p className="text-xs text-gray-400 mt-0.5">
                                        {recipient.programs.join(", ")}
                                      </p>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                    {outreachData && (
                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                        {contactCDEs && (
                          <span>
                            CDEs: {outreachData.limits.cde} slots remaining
                          </span>
                        )}
                        {contactInvestors && (
                          <span>
                            Investors: {outreachData.limits.investor} slots
                            remaining
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message (Optional)
                    </label>
                    <textarea
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      placeholder="Introduce your project and explain what you're looking for..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-amber-900/30 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-xs text-amber-300">
                      <strong>What gets sent:</strong> Your Project Profile PDF
                      + this message. Recipients can respond directly or request
                      more info.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowInterestModal(false);
                      setSelectedRecipients([]);
                      setOutreachError(null);
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExpressInterest}
                    disabled={
                      interestSubmitting ||
                      (!contactCDEs && !contactInvestors) ||
                      selectedRecipients.length === 0
                    }
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {interestSubmitting
                      ? "Sending..."
                      : `Send Outreach${selectedRecipients.length > 0 ? ` (${selectedRecipients.length})` : ""}`}
                  </button>
                </div>
              </>
            ) : (
              /* CDE/INVESTOR VIEW - Express Interest to Sponsor */
              <>
                <h3 className="text-xl font-semibold text-white mb-2">
                  Express Interest
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                  Submit your interest in {deal.projectName}
                </p>

                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Your Organization</span>
                      <span className="text-white font-medium">
                        {orgName || "Demo Organization"}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Contact</span>
                      <span className="text-white">{userName || "User"}</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message to Sponsor (Optional)
                    </label>
                    <textarea
                      value={interestMessage}
                      onChange={(e) => setInterestMessage(e.target.value)}
                      placeholder="Introduce yourself and explain your interest in this project..."
                      rows={4}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
                    <p className="text-xs text-indigo-300">
                      <strong>What happens next:</strong> The sponsor will
                      receive your contact information and message. They
                      typically respond within 24-48 hours.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowInterestModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExpressInterest}
                    disabled={interestSubmitting}
                    className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait transition-colors font-medium"
                  >
                    {interestSubmitting ? "Submitting..." : "Submit Interest"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Success Toast */}
      {interestSubmitted && (
        <div className="fixed bottom-6 right-6 z-50 bg-green-900 border border-green-700 rounded-xl p-4 shadow-xl animate-in slide-in-from-bottom">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <p className="font-medium text-green-100">Interest Submitted!</p>
              <p className="text-sm text-green-300">
                The sponsor will contact you soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
