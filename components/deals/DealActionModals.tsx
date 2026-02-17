"use client";

import React, { useState } from "react";
import { Deal } from "@/lib/data/deals";

export type ModalType =
  | "interest"
  | "loi"
  | "commitment"
  | "request-info"
  | "verbal-loi"
  | "loi-accepted"
  | "commitment-accepted"
  | "send-message"
  | null;

interface DealActionModalsProps {
  deal: Deal;
  orgType: string;
  orgName: string;
  userName: string;
  organizationId: string;
  isOwner: boolean;
  showModal: boolean;
  modalType: ModalType;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>;
}

export default function DealActionModals({
  deal,
  orgType: _orgType,
  orgName,
  userName,
  organizationId,
  isOwner,
  showModal,
  modalType,
  onClose,
  onSubmit,
}: DealActionModalsProps) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        dealId: deal.id,
        message,
        type: modalType,
        senderOrgId: organizationId,
        senderName: userName,
        senderOrg: orgName,
      });
      setMessage("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!showModal || !modalType) return null;

  const getModalContent = () => {
    switch (modalType) {
      case "interest":
        return {
          title: isOwner ? "Contact CDEs & Investors" : "Express Interest",
          description: isOwner
            ? `Reach out to potential partners for ${deal.projectName}`
            : `Submit your interest in ${deal.projectName}`,
          placeholder: isOwner
            ? "Introduce your project and explain what you're looking for..."
            : "Introduce yourself and explain your interest in this project...",
          submitLabel: isOwner ? "Send Outreach" : "Submit Interest",
          infoText: isOwner
            ? "Your Project Profile PDF + this message will be sent to selected recipients."
            : "The sponsor will receive your contact information and message. They typically respond within 24-48 hours.",
        };

      case "request-info":
        return {
          title: "Request More Information",
          description: `Request additional details about ${deal.projectName}`,
          placeholder: "What specific information would you like to know?",
          submitLabel: "Send Request",
          infoText:
            "The sponsor will receive your request and respond with the requested information.",
        };

      case "loi":
        return {
          title: "Create Letter of Intent",
          description: `Create an LOI for ${deal.projectName}`,
          placeholder: "Add any notes or special terms for this LOI...",
          submitLabel: "Create LOI",
          infoText:
            "An LOI template will be generated based on the project details and your organization's standard terms.",
        };

      case "commitment":
        return {
          title: "Create Commitment Letter",
          description: `Create a commitment for ${deal.projectName}`,
          placeholder:
            "Add any notes or special conditions for this commitment...",
          submitLabel: "Create Commitment",
          infoText:
            "A commitment letter template will be generated. You can customize terms before sending.",
        };

      case "verbal-loi":
        return {
          title: "Send Verbal LOI",
          description: `Express verbal intent to proceed with ${deal.projectName}`,
          placeholder:
            "Add any verbal commitments or preliminary terms discussed...",
          submitLabel: "Send Verbal LOI",
          infoText:
            "This records your verbal intent. A formal LOI should follow within 5 business days.",
        };

      case "loi-accepted":
        return {
          title: "Accept Letter of Intent",
          description: `Accept the LOI for ${deal.projectName}`,
          placeholder: "Add any acceptance notes or next steps...",
          submitLabel: "Accept LOI",
          infoText:
            "Accepting the LOI signals mutual intent to proceed. Due diligence typically begins after acceptance.",
        };

      case "commitment-accepted":
        return {
          title: "Accept Commitment Letter",
          description: `Accept the commitment for ${deal.projectName}`,
          placeholder:
            "Add any acceptance notes or closing timeline details...",
          submitLabel: "Accept Commitment",
          infoText:
            "Accepting the commitment triggers the closing process. Ensure all due diligence is complete.",
        };

      case "send-message":
        return {
          title: "Send Message",
          description: `Send a message to the sponsor of ${deal.projectName}`,
          placeholder: "Write your message to the sponsor...",
          submitLabel: "Send Message",
          infoText:
            "Note: You can only send one initial message per deal. Make it count! The sponsor can respond if interested.",
        };

      default:
        return null;
    }
  };

  const content = getModalContent();
  if (!content) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
        <h3 className="text-xl font-semibold text-white mb-2">
          {content.title}
        </h3>
        <p className="text-gray-400 text-sm mb-6">{content.description}</p>

        <div className="space-y-4">
          {!isOwner && (
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
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {modalType === "interest"
                ? "Message (Optional)"
                : "Details (Optional)"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={content.placeholder}
              rows={4}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-lg p-3">
            <p className="text-xs text-indigo-300">
              <strong>What happens next:</strong> {content.infoText}
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait transition-colors font-medium"
          >
            {submitting ? "Sending..." : content.submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
