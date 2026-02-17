"use client";

import { useState } from "react";

// Role definitions per MVP spec
export type ParticipantRole =
  | "sponsor"
  | "cde"
  | "investor"
  | "counsel"
  | "lender"
  | "admin";

export interface Participant {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: ParticipantRole;
  accessLevel: "view" | "edit" | "admin";
  lastActive?: Date;
  avatar?: string;
}

const roleConfig: Record<
  ParticipantRole,
  { label: string; color: string; icon: string }
> = {
  sponsor: { label: "Sponsor", color: "bg-green-600", icon: "🏢" },
  cde: { label: "CDE", color: "bg-purple-600", icon: "🏛️" },
  investor: { label: "Investor", color: "bg-blue-600", icon: "💰" },
  counsel: { label: "Legal Counsel", color: "bg-amber-600", icon: "⚖️" },
  lender: { label: "Lender", color: "bg-cyan-600", icon: "🏦" },
  admin: { label: "Admin", color: "bg-red-600", icon: "⚙️" },
};

interface DealRoomParticipantsProps {
  participants: Participant[];
  currentUserRole?: ParticipantRole;
  onInvite?: () => void;
  onRemove?: (participantId: string) => void;
  onChangeAccess?: (
    participantId: string,
    newAccess: "view" | "edit" | "admin",
  ) => void;
}

export default function DealRoomParticipants({
  participants,
  currentUserRole = "sponsor",
  onInvite,
  onRemove,
  onChangeAccess,
}: DealRoomParticipantsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const canManageParticipants = ["admin", "sponsor", "cde"].includes(
    currentUserRole,
  );

  const groupedByRole = participants.reduce(
    (acc, p) => {
      if (!acc[p.role]) acc[p.role] = [];
      acc[p.role].push(p);
      return acc;
    },
    {} as Record<ParticipantRole, Participant[]>,
  );

  return (
    <div className="space-y-6">
      {/* Header with invite button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100">
            Deal Room Participants
          </h3>
          <p className="text-sm text-gray-400">
            {participants.length} participants with access
          </p>
        </div>
        {canManageParticipants && onInvite && (
          <button
            onClick={onInvite}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>+</span>
            <span>Invite Participant</span>
          </button>
        )}
      </div>

      {/* Participants grouped by role */}
      <div className="space-y-4">
        {(Object.keys(roleConfig) as ParticipantRole[]).map((role) => {
          const roleParticipants = groupedByRole[role] || [];
          if (roleParticipants.length === 0) return null;

          const config = roleConfig[role];

          return (
            <div
              key={role}
              className="border border-gray-700 rounded-lg overflow-hidden"
            >
              {/* Role header */}
              <div
                className={`px-4 py-2 ${config.color}/20 border-b border-gray-700 flex items-center gap-2`}
              >
                <span>{config.icon}</span>
                <span className="font-medium text-gray-200">
                  {config.label}
                </span>
                <span className="text-sm text-gray-400">
                  ({roleParticipants.length})
                </span>
              </div>

              {/* Participants list */}
              <div className="divide-y divide-gray-800">
                {roleParticipants.map((participant) => (
                  <div
                    key={participant.id}
                    className="p-4 hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-full ${config.color} flex items-center justify-center text-white font-bold`}
                      >
                        {participant.avatar ? (
                          <img
                            src={participant.avatar}
                            alt=""
                            className="w-full h-full rounded-full"
                          />
                        ) : (
                          participant.name.charAt(0).toUpperCase()
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-200 font-medium truncate">
                          {participant.name}
                        </p>
                        <p className="text-sm text-gray-400 truncate">
                          {participant.organization}
                        </p>
                      </div>

                      {/* Access level badge */}
                      <div
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          participant.accessLevel === "admin"
                            ? "bg-red-900/50 text-red-300"
                            : participant.accessLevel === "edit"
                              ? "bg-blue-900/50 text-blue-300"
                              : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {participant.accessLevel.toUpperCase()}
                      </div>

                      {/* Actions */}
                      {canManageParticipants && (
                        <button
                          onClick={() =>
                            setExpandedId(
                              expandedId === participant.id
                                ? null
                                : participant.id,
                            )
                          }
                          className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                        >
                          ⋮
                        </button>
                      )}
                    </div>

                    {/* Expanded actions */}
                    {expandedId === participant.id && canManageParticipants && (
                      <div className="mt-3 pt-3 border-t border-gray-700 flex gap-2">
                        <button
                          onClick={() =>
                            onChangeAccess?.(participant.id, "view")
                          }
                          className={`px-3 py-1 text-xs rounded ${
                            participant.accessLevel === "view"
                              ? "bg-gray-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          View Only
                        </button>
                        <button
                          onClick={() =>
                            onChangeAccess?.(participant.id, "edit")
                          }
                          className={`px-3 py-1 text-xs rounded ${
                            participant.accessLevel === "edit"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            onChangeAccess?.(participant.id, "admin")
                          }
                          className={`px-3 py-1 text-xs rounded ${
                            participant.accessLevel === "admin"
                              ? "bg-red-600 text-white"
                              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                          }`}
                        >
                          Admin
                        </button>
                        <button
                          onClick={() => onRemove?.(participant.id)}
                          className="px-3 py-1 text-xs rounded bg-red-900/50 text-red-300 hover:bg-red-900 ml-auto"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {participants.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg mb-2">No participants yet</p>
          <p className="text-sm">
            Invite CDEs, investors, and legal counsel to this deal room
          </p>
        </div>
      )}
    </div>
  );
}
