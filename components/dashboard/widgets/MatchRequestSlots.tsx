"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  Wallet,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api/fetch-utils";
import type {
  MatchRequestSlots,
  MatchRequest,
  MatchTargetType,
} from "@/lib/types/match-request";

interface MatchRequestSlotsWidgetProps {
  sponsorId: string;
  className?: string;
}

/**
 * Widget showing the 3-request limit status for Sponsors
 * Displays available slots for CDE and Investor requests
 */
export default function MatchRequestSlotsWidget({
  sponsorId,
  className = "",
}: MatchRequestSlotsWidgetProps) {
  const [slots, setSlots] = useState<MatchRequestSlots | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSlots() {
      if (!sponsorId) return;

      setLoading(true);
      try {
        const result = await fetchApi<{ slots: MatchRequestSlots }>(
          `/api/match-requests?sponsorId=${sponsorId}&includeSlots=true`,
        );

        if (result.success && result.data?.slots) {
          setSlots(result.data.slots);
        }
      } catch (err) {
        setError("Failed to load request slots");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadSlots();
  }, [sponsorId]);

  if (loading) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/3 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-gray-800 rounded-lg" />
            <div className="h-24 bg-gray-800 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !slots) {
    return (
      <div
        className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
      >
        <div className="text-center py-4">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            {error || "Unable to load slots"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-900/80 backdrop-blur rounded-xl border border-gray-800 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">
          Match Request Slots
        </h3>
        <Link
          href="/dashboard/requests"
          className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
        >
          Manage <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SlotCard
          type="cde"
          label="CDE Requests"
          icon={Building2}
          slots={slots.cde}
          color="purple"
        />
        <SlotCard
          type="investor"
          label="Investor Requests"
          icon={Wallet}
          slots={slots.investor}
          color="emerald"
        />
      </div>

      {/* Active Requests Preview */}
      {(slots.cde.requests.length > 0 ||
        slots.investor.requests.length > 0) && (
        <div className="mt-4 pt-4 border-t border-gray-800">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            Active Requests
          </p>
          <div className="space-y-2">
            {[...slots.cde.requests, ...slots.investor.requests]
              .filter((r) => r.status === "pending")
              .slice(0, 3)
              .map((request) => (
                <RequestRow key={request.id} request={request} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface SlotCardProps {
  type: MatchTargetType;
  label: string;
  icon: React.ElementType;
  slots: {
    used: number;
    max: number;
    available: number;
  };
  color: "purple" | "emerald";
}

function SlotCard({
  type: _type,
  label,
  icon: Icon,
  slots,
  color,
}: SlotCardProps) {
  const colorClasses = {
    purple: {
      bg: "bg-purple-900/30",
      border: "border-purple-500/30",
      text: "text-purple-400",
      fill: "bg-purple-500",
    },
    emerald: {
      bg: "bg-emerald-900/30",
      border: "border-emerald-500/30",
      text: "text-emerald-400",
      fill: "bg-emerald-500",
    },
  };

  const classes = colorClasses[color];
  const usagePercent = (slots.used / slots.max) * 100;

  return (
    <div className={`rounded-lg p-3 ${classes.bg} border ${classes.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${classes.text}`} />
        <span className="text-xs font-medium text-gray-400">{label}</span>
      </div>

      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${classes.text}`}>
          {slots.available}
        </span>
        <span className="text-xs text-gray-500 pb-1">
          / {slots.max} available
        </span>
      </div>

      {/* Usage bar */}
      <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${classes.fill} rounded-full transition-all duration-500`}
          style={{ width: `${usagePercent}%` }}
        />
      </div>

      {slots.available === 0 && (
        <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          All slots used
        </p>
      )}
    </div>
  );
}

function RequestRow({ request }: { request: MatchRequest }) {
  const statusConfig: Record<
    string,
    { icon: React.ElementType; color: string }
  > = {
    pending: { icon: Clock, color: "text-amber-400" },
    accepted: { icon: CheckCircle, color: "text-emerald-400" },
    declined: { icon: XCircle, color: "text-rose-400" },
    withdrawn: { icon: XCircle, color: "text-gray-400" },
  };

  const config = statusConfig[request.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="flex items-center justify-between py-1.5 px-2 bg-gray-800/50 rounded-lg">
      <div className="flex items-center gap-2">
        <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
        <span className="text-sm text-gray-300 truncate max-w-[150px]">
          {request.targetName || `${request.targetType.toUpperCase()} Request`}
        </span>
      </div>
      <span className="text-xs text-gray-500 capitalize">{request.status}</span>
    </div>
  );
}
