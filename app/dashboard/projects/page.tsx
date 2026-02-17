"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useCurrentUser } from "@/lib/auth";
import { fetchDealsByOrganization } from "@/lib/supabase/queries";

// Unified with lib/db/types.ts DealStatus
type ProjectStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "available"
  | "seeking_capital"
  | "matched"
  | "closing"
  | "closed"
  | "withdrawn";

interface SponsorProject {
  id: string;
  projectName: string;
  city: string;
  state: string;
  programType: "NMTC" | "HTC" | "LIHTC" | "OZ";
  allocationRequest: number;
  totalProjectCost: number;
  status: ProjectStatus;
  submittedDate?: string;
  matchedCDE?: string;
  matchScore?: number;
  tractType: string[];
  censusTract: string;
  lastUpdated: string;
  completionPercent: number;
}

const STATUS_CONFIG: Record<
  ProjectStatus,
  { label: string; color: string; bgColor: string }
> = {
  draft: { label: "Draft", color: "text-gray-400", bgColor: "bg-gray-800" },
  submitted: {
    label: "Submitted",
    color: "text-blue-400",
    bgColor: "bg-blue-900/50",
  },
  under_review: {
    label: "Under Review",
    color: "text-amber-400",
    bgColor: "bg-amber-900/50",
  },
  available: {
    label: "Available",
    color: "text-green-400",
    bgColor: "bg-green-900/50",
  },
  seeking_capital: {
    label: "Seeking Capital",
    color: "text-indigo-400",
    bgColor: "bg-indigo-900/50",
  },
  matched: {
    label: "Matched",
    color: "text-purple-400",
    bgColor: "bg-purple-900/50",
  },
  closing: {
    label: "Closing",
    color: "text-teal-400",
    bgColor: "bg-teal-900/50",
  },
  closed: {
    label: "Closed",
    color: "text-emerald-400",
    bgColor: "bg-emerald-900/50",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-red-400",
    bgColor: "bg-red-900/50",
  },
};

export default function ProjectsPage() {
  return (
    <ProtectedRoute>
      <ProjectsContent />
    </ProtectedRoute>
  );
}

function ProjectsContent() {
  const { orgName, organizationId } = useCurrentUser();
  const [projects, setProjects] = useState<SponsorProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | "all">(
    "all",
  );
  const [selectedProject, setSelectedProject] = useState<SponsorProject | null>(
    null,
  );

  useEffect(() => {
    async function loadProjects() {
      if (!organizationId) return;
      setIsLoading(true);
      try {
        const deals = await fetchDealsByOrganization(organizationId);
        const mapped: SponsorProject[] = deals.map((d) => {
          // Calculate completion from readiness_score or estimate from status
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const readinessScore =
            (d as any).readinessScore || (d as any).readiness_score || 0;
          let completionPercent = readinessScore;
          if (!completionPercent) {
            const statusProgress: Record<string, number> = {
              draft: 15,
              submitted: 40,
              under_review: 50,
              available: 60,
              seeking_capital: 70,
              matched: 80,
              closing: 90,
              closed: 100,
              withdrawn: 0,
            };
            completionPercent = statusProgress[d.status] || 0;
          }

          return {
            id: d.id,
            projectName: d.projectName,
            city: d.city,
            state: d.state,
            programType: d.programType as SponsorProject["programType"],
            allocationRequest: d.allocation,
            totalProjectCost: d.projectCost || d.allocation * 2.5,
            status: d.status as ProjectStatus,
            submittedDate: d.submittedDate,
            tractType: d.tractType,
            censusTract: d.censusTract || "",
            lastUpdated: d.submittedDate,
            completionPercent,
          };
        });
        setProjects(mapped);
      } catch (error) {
        console.error("Failed to load projects:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProjects();
  }, [organizationId]);

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  const filteredProjects =
    filterStatus === "all"
      ? projects
      : projects.filter((p) => p.status === filterStatus);

  // Stats
  const totalRequested = projects.reduce(
    (sum, p) => sum + p.allocationRequest,
    0,
  );
  const _activeProjects = projects.filter((p) =>
    ["submitted", "matched", "closing"].includes(p.status),
  ).length;
  const matchedProjects = projects.filter((p) =>
    ["matched", "closing", "closed"].includes(p.status),
  ).length;
  const closedProjects = projects.filter((p) => p.status === "closed").length;

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">My Projects</h1>
          <p className="text-gray-400 mt-1">
            {orgName || "Demo Sponsor Organization"}
          </p>
        </div>
        <Link
          href="/deals/new"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Submit New Project
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Total Projects</div>
          <div className="text-2xl font-bold text-white">{projects.length}</div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Total Requested</div>
          <div className="text-2xl font-bold text-indigo-400">
            {formatCurrency(totalRequested)}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Matched</div>
          <div className="text-2xl font-bold text-green-400">
            {matchedProjects}
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="text-sm text-gray-400 mb-1">Closed</div>
          <div className="text-2xl font-bold text-emerald-400">
            {closedProjects}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterStatus("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          All ({projects.length})
        </button>
        <button
          onClick={() => setFilterStatus("draft")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "draft"
              ? "bg-gray-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Drafts ({projects.filter((p) => p.status === "draft").length})
        </button>
        <button
          onClick={() => setFilterStatus("submitted")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "submitted"
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Submitted ({projects.filter((p) => p.status === "submitted").length})
        </button>
        <button
          onClick={() => setFilterStatus("matched")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "matched"
              ? "bg-green-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Matched ({projects.filter((p) => p.status === "matched").length})
        </button>
        <button
          onClick={() => setFilterStatus("closing")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "closing"
              ? "bg-purple-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Closing ({projects.filter((p) => p.status === "closing").length})
        </button>
        <button
          onClick={() => setFilterStatus("closed")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === "closed"
              ? "bg-emerald-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Closed ({projects.filter((p) => p.status === "closed").length})
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredProjects.map((project) => (
          <div
            key={project.id}
            className="bg-gray-900 rounded-xl border border-gray-800 p-5 hover:border-indigo-500 transition-colors cursor-pointer"
            onClick={() => setSelectedProject(project)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-100">
                  {project.projectName}
                </h3>
                <p className="text-sm text-gray-500">
                  {project.city}, {project.state}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[project.status].bgColor} ${STATUS_CONFIG[project.status].color}`}
              >
                {STATUS_CONFIG[project.status].label}
              </span>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Allocation Request</span>
                <span className="text-indigo-400 font-medium">
                  {formatCurrency(project.allocationRequest)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Cost</span>
                <span className="text-gray-300">
                  {formatCurrency(project.totalProjectCost)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Program</span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    project.programType === "NMTC"
                      ? "bg-indigo-900/50 text-indigo-400"
                      : project.programType === "HTC"
                        ? "bg-amber-900/50 text-amber-400"
                        : "bg-green-900/50 text-green-400"
                  }`}
                >
                  {project.programType}
                </span>
              </div>
            </div>

            {/* Tract Types */}
            <div className="flex gap-1 mb-4">
              {project.tractType.map((tract) => (
                <span
                  key={tract}
                  className={`px-1.5 py-0.5 rounded text-xs ${
                    tract === "SD"
                      ? "bg-red-900/50 text-red-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {tract}
                </span>
              ))}
            </div>

            {/* Draft Progress */}
            {project.status === "draft" && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Intake Progress</span>
                  <span className="text-gray-400">
                    {project.completionPercent}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${project.completionPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Matched CDE */}
            {project.matchedCDE && (
              <div className="pt-3 border-t border-gray-800">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Matched with</p>
                    <p className="text-sm text-green-400 font-medium">
                      {project.matchedCDE}
                    </p>
                  </div>
                  {project.matchScore && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Score</p>
                      <p className="text-lg font-bold text-green-400">
                        {project.matchScore}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between text-xs text-gray-500">
              <span>
                Updated {new Date(project.lastUpdated).toLocaleDateString()}
              </span>
              <span className="font-mono">{project.censusTract}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-600"
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
          </div>
          <h3 className="text-lg font-medium text-gray-300 mb-2">
            No projects found
          </h3>
          <p className="text-gray-500 mb-4">
            No projects match the selected filter
          </p>
          <button
            onClick={() => setFilterStatus("all")}
            className="text-indigo-400 hover:text-indigo-300"
          >
            View all projects
          </button>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setSelectedProject(null)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-2xl mx-4 border border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedProject.status].bgColor} ${STATUS_CONFIG[selectedProject.status].color}`}
                  >
                    {STATUS_CONFIG[selectedProject.status].label}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-medium ${
                      selectedProject.programType === "NMTC"
                        ? "bg-indigo-900/50 text-indigo-400"
                        : "bg-amber-900/50 text-amber-400"
                    }`}
                  >
                    {selectedProject.programType}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-white">
                  {selectedProject.projectName}
                </h3>
                <p className="text-gray-400">
                  {selectedProject.city}, {selectedProject.state}
                </p>
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-gray-500 hover:text-white"
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

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">
                  Allocation Request
                </div>
                <div className="text-xl font-bold text-indigo-400">
                  {formatCurrency(selectedProject.allocationRequest)}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">
                  Total Project Cost
                </div>
                <div className="text-xl font-bold text-white">
                  {formatCurrency(selectedProject.totalProjectCost)}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Census Tract</span>
                  <p className="text-gray-200 font-mono">
                    {selectedProject.censusTract}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Tract Designations</span>
                  <div className="flex gap-1 mt-1">
                    {selectedProject.tractType.map((tract) => (
                      <span
                        key={tract}
                        className={`px-1.5 py-0.5 rounded text-xs ${
                          tract === "SD"
                            ? "bg-red-900/50 text-red-400"
                            : "bg-gray-800 text-gray-400"
                        }`}
                      >
                        {tract}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              {selectedProject.submittedDate && (
                <div className="text-sm">
                  <span className="text-gray-500">Submitted</span>
                  <p className="text-gray-200">
                    {new Date(
                      selectedProject.submittedDate,
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
              {selectedProject.matchedCDE && (
                <div className="p-4 bg-green-900/20 border border-green-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-green-400 font-medium">
                        Matched CDE
                      </p>
                      <p className="text-white font-semibold">
                        {selectedProject.matchedCDE}
                      </p>
                    </div>
                    {selectedProject.matchScore && (
                      <div className="text-right">
                        <p className="text-xs text-green-400">Match Score</p>
                        <p className="text-2xl font-bold text-green-400">
                          {selectedProject.matchScore}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              {selectedProject.status === "draft" && (
                <Link
                  href={`/deals/new?continue=${selectedProject.id}`}
                  className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 font-medium text-center"
                >
                  Continue Editing
                </Link>
              )}
              <Link
                href={`/deals/${selectedProject.id}`}
                className="flex-1 px-4 py-2.5 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 text-center"
              >
                View Details
              </Link>
              <Link
                href={`/deals/${selectedProject.id}/profile`}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-500 font-medium text-center"
              >
                Project Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
