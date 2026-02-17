"use client";

import { useState } from "react";

export type TimelineEventType =
  | "intake_submitted"
  | "deal_matched"
  | "loi_received"
  | "term_sheet_signed"
  | "due_diligence_start"
  | "doc_uploaded"
  | "doc_approved"
  | "compliance_check"
  | "closing_scheduled"
  | "funds_transfer"
  | "deal_closed"
  | "post_close";

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  date: Date;
  status: "completed" | "current" | "upcoming" | "overdue";
  assignedTo?: string;
  dueDate?: Date;
  completedBy?: string;
}

const eventConfig: Record<TimelineEventType, { icon: string; color: string }> =
  {
    intake_submitted: { icon: "📝", color: "text-blue-400" },
    deal_matched: { icon: "🤝", color: "text-purple-400" },
    loi_received: { icon: "📧", color: "text-green-400" },
    term_sheet_signed: { icon: "✍️", color: "text-amber-400" },
    due_diligence_start: { icon: "🔍", color: "text-cyan-400" },
    doc_uploaded: { icon: "📄", color: "text-gray-400" },
    doc_approved: { icon: "✓", color: "text-green-400" },
    compliance_check: { icon: "⚖️", color: "text-red-400" },
    closing_scheduled: { icon: "📅", color: "text-indigo-400" },
    funds_transfer: { icon: "💰", color: "text-green-400" },
    deal_closed: { icon: "🎉", color: "text-green-400" },
    post_close: { icon: "📊", color: "text-gray-400" },
  };

interface ClosingTimelineProps {
  events: TimelineEvent[];
  currentPhase?: TimelineEventType;
  estimatedCloseDate?: Date;
  onAddTask?: (task: Partial<TimelineEvent>) => void;
}

export default function ClosingTimeline({
  events,
  currentPhase: _currentPhase,
  estimatedCloseDate,
  onAddTask,
}: ClosingTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sort events by date
  const sortedEvents = [...events].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Calculate progress
  const completedEvents = events.filter((e) => e.status === "completed").length;
  const progress =
    events.length > 0 ? (completedEvents / events.length) * 100 : 0;

  // Days until close
  const daysUntilClose = estimatedCloseDate
    ? Math.ceil(
        (estimatedCloseDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-100">
              Closing Timeline
            </h3>
            <p className="text-sm text-gray-400">
              {completedEvents} of {events.length} milestones completed
            </p>
          </div>
          {estimatedCloseDate && (
            <div className="text-right">
              <p className="text-sm text-gray-400">Estimated Close</p>
              <p className="text-xl font-bold text-gray-100">
                {estimatedCloseDate.toLocaleDateString()}
              </p>
              {daysUntilClose !== null && (
                <p
                  className={`text-sm ${daysUntilClose < 0 ? "text-red-400" : daysUntilClose < 14 ? "text-amber-400" : "text-green-400"}`}
                >
                  {daysUntilClose < 0
                    ? `${Math.abs(daysUntilClose)} days overdue`
                    : `${daysUntilClose} days remaining`}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              progress >= 100 ? "bg-green-500" : "bg-indigo-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-700" />

        {/* Events */}
        <div className="space-y-4">
          {sortedEvents.map((event, _index) => {
            const config = eventConfig[event.type];
            const isExpanded = expandedId === event.id;

            return (
              <div key={event.id} className="relative pl-16">
                {/* Timeline dot */}
                <div
                  className={`absolute left-4 w-5 h-5 rounded-full flex items-center justify-center -translate-x-1/2 ${
                    event.status === "completed"
                      ? "bg-green-600"
                      : event.status === "current"
                        ? "bg-indigo-600 ring-4 ring-indigo-600/30"
                        : event.status === "overdue"
                          ? "bg-red-600"
                          : "bg-gray-700"
                  }`}
                >
                  {event.status === "completed" && (
                    <span className="text-white text-xs">✓</span>
                  )}
                </div>

                {/* Event card */}
                <div
                  className={`bg-gray-800/50 rounded-lg border transition-colors cursor-pointer ${
                    event.status === "current"
                      ? "border-indigo-600"
                      : event.status === "overdue"
                        ? "border-red-600"
                        : "border-gray-700 hover:border-gray-600"
                  }`}
                  onClick={() => setExpandedId(isExpanded ? null : event.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <span className={`text-xl ${config.color}`}>
                          {config.icon}
                        </span>
                        <div>
                          <p className="font-medium text-gray-200">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-500">
                            {event.date.toLocaleDateString()}
                            {event.date.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          event.status === "completed"
                            ? "bg-green-900/50 text-green-300"
                            : event.status === "current"
                              ? "bg-indigo-900/50 text-indigo-300"
                              : event.status === "overdue"
                                ? "bg-red-900/50 text-red-300"
                                : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {event.status === "completed"
                          ? "Completed"
                          : event.status === "current"
                            ? "In Progress"
                            : event.status === "overdue"
                              ? "Overdue"
                              : "Upcoming"}
                      </span>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                        {event.description && (
                          <p className="text-sm text-gray-400">
                            {event.description}
                          </p>
                        )}
                        {event.assignedTo && (
                          <p className="text-sm text-gray-400">
                            <span className="text-gray-500">Assigned to:</span>{" "}
                            {event.assignedTo}
                          </p>
                        )}
                        {event.dueDate && (
                          <p className="text-sm text-gray-400">
                            <span className="text-gray-500">Due:</span>{" "}
                            {event.dueDate.toLocaleDateString()}
                          </p>
                        )}
                        {event.completedBy && (
                          <p className="text-sm text-gray-400">
                            <span className="text-gray-500">Completed by:</span>{" "}
                            {event.completedBy}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Button */}
      {onAddTask && (
        <button
          onClick={() => onAddTask({})}
          className="w-full py-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:text-gray-300 hover:border-gray-600 transition-colors"
        >
          + Add Milestone
        </button>
      )}

      {/* Empty state */}
      {events.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400 text-lg mb-2">No timeline events yet</p>
          <p className="text-gray-500 text-sm">
            Timeline will populate as the deal progresses
          </p>
        </div>
      )}
    </div>
  );
}
