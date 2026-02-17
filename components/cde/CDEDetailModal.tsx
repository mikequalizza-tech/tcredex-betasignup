"use client";

import { useState, useEffect, useMemo } from "react";
import { CDEDealCard } from "@/lib/types/cde";
import { fetchCDEBySlug, CDEDetail } from "@/lib/supabase/queries";
import { useCurrentUser } from "@/lib/auth";
import { apiPost } from "@/lib/api/fetch-utils";

interface CDEDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  cde: CDEDealCard | null;
}

export default function CDEDetailModal({
  isOpen,
  onClose,
  cde,
}: CDEDetailModalProps) {
  const [cdeDetail, setCdeDetail] = useState<CDEDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const { orgType, organizationId, userName, orgName } = useCurrentUser();

  useEffect(() => {
    if (isOpen && cde) {
      loadCDEDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadCDEDetail only depends on cde which is already in deps
  }, [isOpen, cde]);

  const loadCDEDetail = async () => {
    if (!cde) return;
    setLoading(true);
    try {
      // Try to fetch full CDE detail by ID
      const detail = await fetchCDEBySlug(cde.id);
      setCdeDetail(detail);
    } catch (error) {
      console.error("Failed to load CDE detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !cde || sendingMessage || !organizationId)
      return;

    setSendingMessage(true);
    try {
      // Get the CDE's organization ID (from cdes_merged.organization_id)
      const cdeOrgId = cde.organizationId || cdeDetail?.id || cde.id;

      if (!cdeOrgId) {
        throw new Error("Unable to identify CDE organization");
      }

      // First, create or get a conversation with the CDE
      const conversationResult = await apiPost<{
        conversation?: { id: string };
        id?: string;
      }>("/api/messages/conversations", {
        type: "direct",
        category: "cde_inquiry",
        participantIds: [cdeOrgId], // CDE's organization_id
        organizationId: organizationId,
        creatorId: "", // Will be set by the API from auth
        creatorName: userName || "Sponsor",
        creatorOrg: orgName || "Organization",
      });

      if (!conversationResult.success || !conversationResult.data) {
        throw new Error(
          conversationResult.error || "Failed to create conversation",
        );
      }

      const conversationId =
        conversationResult.data.conversation?.id || conversationResult.data.id;

      if (!conversationId) {
        throw new Error("Failed to get conversation ID");
      }

      // Now send the message
      const messageResult = await apiPost<{ message?: unknown }>(
        "/api/messages",
        {
          conversationId,
          content: messageText.trim(),
          senderId: "", // Will be set by the API from auth
          senderName: userName || "Sponsor",
          senderOrg: orgName || "Organization",
          senderOrgId: organizationId,
        },
      );

      if (messageResult.success) {
        setMessageText("");
        alert("Message sent successfully! The CDE will be notified.");
        onClose();
      } else {
        throw new Error(messageResult.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to send message. Please try again.",
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // OPTIMIZATION: Memoize currency formatter to avoid recreating on every render
  const formatCurrency = useMemo(
    () => (num: number) =>
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(num),
    [],
  );

  if (!isOpen || !cde) return null;

  const displayData = cdeDetail || {
    id: cde.id,
    name: cde.organizationName,
    slug: cde.id,
    description: cde.missionSnippet,
    headquartersCity: "",
    headquartersState: cde.primaryStates?.[0] || "",
    missionFocus: cde.impactPriorities || [],
    projectTypes: cde.targetSectors || [],
    serviceArea: cde.primaryStates || [],
    serviceAreaType: "regional",
    availableAllocation: cde.remainingAllocation,
    totalAllocation: cde.remainingAllocation,
    allocationYear: new Date().getFullYear().toString(),
    minDealSize: cde.dealSizeRange?.min || 0,
    maxDealSize: cde.dealSizeRange?.max || 0,
    projectsClosed: 0,
    totalDeployed: 0,
    avgDealSize: 0,
    responseTime: "2-3 weeks",
    acceptingApplications: true,
    website: "", // CDEDealCard doesn't have website property
    primaryContact: "", // CDEDealCard doesn't have contactName property
    contactEmail: "", // CDEDealCard doesn't have contactEmail property
    contactPhone: "",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">
                {displayData.name}
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                {displayData.headquartersCity && displayData.headquartersState
                  ? `${displayData.headquartersCity}, ${displayData.headquartersState}`
                  : displayData.headquartersState || "CDE Profile"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
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
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Mission & Description */}
              {displayData.description && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Mission & Description
                  </h3>
                  <p className="text-gray-300">{displayData.description}</p>
                </div>
              )}

              {/* Allocation Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">
                    Available Allocation
                  </p>
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(displayData.availableAllocation)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Total Allocation</p>
                  <p className="text-2xl font-bold text-gray-300">
                    {formatCurrency(displayData.totalAllocation)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Deal Size Range</p>
                  <p className="text-lg font-semibold text-gray-300">
                    {formatCurrency(displayData.minDealSize)} -{" "}
                    {formatCurrency(displayData.maxDealSize)}
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-1">Response Time</p>
                  <p className="text-lg font-semibold text-gray-300">
                    {displayData.responseTime}
                  </p>
                </div>
              </div>

              {/* Service Area */}
              {cde.serviceArea && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Service Area
                  </h3>
                  <p className="text-gray-300">{cde.serviceArea}</p>
                </div>
              )}

              {/* Geographic Focus */}
              {displayData.serviceArea &&
                displayData.serviceArea.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">
                      Primary States
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayData.serviceArea.map((state, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-indigo-900/30 text-indigo-300 rounded-full text-sm"
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Focus Areas / Predominant Market */}
              {cde.predominantMarket && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Focus Areas
                  </h3>
                  <p className="text-gray-300">{cde.predominantMarket}</p>
                </div>
              )}

              {/* Target Sectors */}
              {displayData.projectTypes &&
                displayData.projectTypes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">
                      Target Sectors
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayData.projectTypes.map((sector, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-purple-900/30 text-purple-300 rounded-full text-sm"
                        >
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Mission Focus */}
              {displayData.missionFocus &&
                displayData.missionFocus.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-100 mb-2">
                      Impact Priorities
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {displayData.missionFocus.map((focus, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-emerald-900/30 text-emerald-300 rounded-full text-sm"
                        >
                          {focus}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Preferences */}
              <div>
                <h3 className="text-lg font-semibold text-gray-100 mb-3">
                  Deal Preferences
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        cde.ruralFocus ? "text-green-400" : "text-gray-500"
                      }
                    >
                      ✓
                    </span>
                    <span className="text-gray-300">
                      Rural Focus: {cde.ruralFocus ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        cde.urbanFocus ? "text-green-400" : "text-gray-500"
                      }
                    >
                      ✓
                    </span>
                    <span className="text-gray-300">
                      Urban Focus: {cde.urbanFocus ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        cde.requireSeverelyDistressed
                          ? "text-green-400"
                          : "text-gray-500"
                      }
                    >
                      ✓
                    </span>
                    <span className="text-gray-300">
                      Requires Severely Distressed:{" "}
                      {cde.requireSeverelyDistressed ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        cde.smallDealFund ? "text-green-400" : "text-gray-500"
                      }
                    >
                      ✓
                    </span>
                    <span className="text-gray-300">
                      Small Deal Fund: {cde.smallDealFund ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        cde.htcExperience ? "text-green-400" : "text-gray-500"
                      }
                    >
                      ✓
                    </span>
                    <span className="text-gray-300">
                      HTC Experience: {cde.htcExperience ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              {displayData.primaryContact && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Contact Information
                  </h3>
                  <div className="space-y-1 text-gray-300">
                    <p>
                      <span className="font-medium">Contact:</span>{" "}
                      {displayData.primaryContact}
                    </p>
                    {displayData.contactEmail && (
                      <p>
                        <span className="font-medium">Email:</span>{" "}
                        {displayData.contactEmail}
                      </p>
                    )}
                    {displayData.contactPhone && (
                      <p>
                        <span className="font-medium">Phone:</span>{" "}
                        {displayData.contactPhone}
                      </p>
                    )}
                    {displayData.website && (
                      <p>
                        <span className="font-medium">Website:</span>{" "}
                        <a
                          href={displayData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:text-indigo-300"
                        >
                          {displayData.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Track Record */}
              {(displayData.projectsClosed > 0 ||
                displayData.totalDeployed > 0) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    Track Record
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">
                        Projects Closed
                      </p>
                      <p className="text-xl font-bold text-gray-300">
                        {displayData.projectsClosed}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">
                        Total Deployed
                      </p>
                      <p className="text-xl font-bold text-gray-300">
                        {formatCurrency(displayData.totalDeployed)}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">
                        Avg Deal Size
                      </p>
                      <p className="text-xl font-bold text-gray-300">
                        {formatCurrency(displayData.avgDealSize)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Message Section - Only for Sponsors */}
              {orgType === "sponsor" && (
                <div className="border-t border-gray-800 pt-6">
                  <h3 className="text-lg font-semibold text-gray-100 mb-3">
                    Send Message to CDE
                  </h3>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Write your message to this CDE..."
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                  />
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || sendingMessage}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        messageText.trim() && !sendingMessage
                          ? "bg-indigo-600 text-white hover:bg-indigo-500"
                          : "bg-gray-700 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-gray-800 text-gray-300 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
