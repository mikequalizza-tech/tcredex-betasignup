"use client";

import React from "react";
import {
  FileText,
  Search,
  Users,
  ShoppingCart,
  Briefcase,
  CheckCircle2,
} from "lucide-react";

/**
 * 6-Stage Deal Status Timeline
 *
 * Stages:
 * 1. Submitted - Deal submitted via intake wizard
 * 2. Scoring - Automated scoring in progress
 * 3. In Market - Available in marketplace
 * 4. Matched - CDE/Investor matched
 * 5. Closing - In closing room
 * 6. Closed - Deal completed
 */

export type DealStage =
  | "draft"
  | "submitted"
  | "scoring"
  | "in_market"
  | "matched"
  | "closing"
  | "closed";

interface TimelineStage {
  id: DealStage;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    id: "submitted",
    label: "Submitted",
    icon: FileText,
    description: "Deal submitted for review",
  },
  {
    id: "scoring",
    label: "Scoring",
    icon: Search,
    description: "Automated scoring in progress",
  },
  {
    id: "in_market",
    label: "In Market",
    icon: ShoppingCart,
    description: "Available to CDEs & Investors",
  },
  {
    id: "matched",
    label: "Matched",
    icon: Users,
    description: "CDE/Investor matched",
  },
  {
    id: "closing",
    label: "Closing",
    icon: Briefcase,
    description: "In closing room",
  },
  {
    id: "closed",
    label: "Closed",
    icon: CheckCircle2,
    description: "Deal completed",
  },
];

interface DealStatusTimelineProps {
  currentStage: DealStage;
  timestamps?: Partial<Record<DealStage, string>>;
  variant?: "horizontal" | "vertical";
  compact?: boolean;
  className?: string;
}

export default function DealStatusTimeline({
  currentStage,
  timestamps = {},
  variant = "horizontal",
  compact = false,
  className = "",
}: DealStatusTimelineProps) {
  const getCurrentIndex = () => {
    if (currentStage === "draft") return -1;
    return TIMELINE_STAGES.findIndex((s) => s.id === currentStage);
  };

  const currentIndex = getCurrentIndex();

  if (variant === "vertical") {
    return (
      <VerticalTimeline
        stages={TIMELINE_STAGES}
        currentIndex={currentIndex}
        timestamps={timestamps}
        compact={compact}
        className={className}
      />
    );
  }

  return (
    <HorizontalTimeline
      stages={TIMELINE_STAGES}
      currentIndex={currentIndex}
      timestamps={timestamps}
      compact={compact}
      className={className}
    />
  );
}

interface TimelineProps {
  stages: TimelineStage[];
  currentIndex: number;
  timestamps: Partial<Record<DealStage, string>>;
  compact: boolean;
  className: string;
}

function HorizontalTimeline({
  stages,
  currentIndex,
  timestamps,
  compact,
  className,
}: TimelineProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const _isUpcoming = index > currentIndex;
          const Icon = stage.icon;
          const timestamp = timestamps[stage.id];

          return (
            <React.Fragment key={stage.id}>
              <div className="flex flex-col items-center">
                {/* Icon Circle */}
                <div
                  className={`
                    ${compact ? "w-8 h-8" : "w-10 h-10"}
                    rounded-full flex items-center justify-center transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                        : isCurrent
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.5)] animate-pulse"
                          : "bg-gray-800 text-gray-500 border border-gray-700"
                    }
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className={compact ? "w-4 h-4" : "w-5 h-5"} />
                  ) : (
                    <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
                  )}
                </div>

                {/* Label */}
                {!compact && (
                  <div className="mt-2 text-center">
                    <p
                      className={`text-xs font-medium ${
                        isCurrent
                          ? "text-indigo-400"
                          : isCompleted
                            ? "text-emerald-400"
                            : "text-gray-500"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {timestamp && (
                      <p className="text-[10px] text-gray-600 mt-0.5">
                        {formatDate(timestamp)}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Connector Line */}
              {index < stages.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full overflow-hidden bg-gray-800">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      isCompleted
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 w-full"
                        : isCurrent
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 w-1/2"
                          : "w-0"
                    }`}
                    style={{
                      boxShadow: isCompleted
                        ? "0 0 8px rgba(16,185,129,0.4)"
                        : isCurrent
                          ? "0 0 8px rgba(99,102,241,0.4)"
                          : "none",
                    }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

function VerticalTimeline({
  stages,
  currentIndex,
  timestamps,
  compact,
  className,
}: TimelineProps) {
  return (
    <div className={`${className}`}>
      <div className="space-y-0">
        {stages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const _isUpcoming = index > currentIndex;
          const Icon = stage.icon;
          const timestamp = timestamps[stage.id];
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.id} className="relative flex gap-4">
              {/* Vertical Line */}
              {!isLast && (
                <div
                  className={`absolute left-4 top-10 w-0.5 h-full -translate-x-1/2 ${
                    isCompleted ? "bg-emerald-500" : "bg-gray-700"
                  }`}
                  style={{
                    boxShadow: isCompleted
                      ? "0 0 4px rgba(16,185,129,0.4)"
                      : "none",
                  }}
                />
              )}

              {/* Icon */}
              <div
                className={`
                  relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                  ${
                    isCompleted
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white"
                      : isCurrent
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white animate-pulse"
                        : "bg-gray-800 text-gray-500 border border-gray-700"
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 ${compact ? "pt-1" : "pt-0.5"}`}>
                <p
                  className={`text-sm font-medium ${
                    isCurrent
                      ? "text-indigo-400"
                      : isCompleted
                        ? "text-emerald-400"
                        : "text-gray-500"
                  }`}
                >
                  {stage.label}
                </p>
                {!compact && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {stage.description}
                  </p>
                )}
                {timestamp && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    {formatDate(timestamp)}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

// Map deal_status enum to timeline stages
export function mapDealStatusToStage(status: string): DealStage {
  const statusMap: Record<string, DealStage> = {
    draft: "draft",
    submitted: "submitted",
    under_review: "scoring",
    available: "in_market",
    seeking_capital: "in_market",
    matched: "matched",
    closing: "closing",
    closed: "closed",
    withdrawn: "draft",
  };
  return statusMap[status?.toLowerCase()] || "draft";
}
