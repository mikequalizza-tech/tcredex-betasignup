"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MarketplaceFooter from "@/components/layout/MarketplaceFooter";
import Logo from "@/components/ui/logo";
import MapFilterRail, {
  FilterState,
  defaultFilters,
  PipelineDealSummary,
} from "@/components/maps/MapFilterRail";
import {
  useRoleConfig,
  fetchMarketplaceForRole,
  MarketplaceResult,
  InvestorCard,
} from "@/lib/roles";
import { Deal } from "@/lib/data/deals";
import { CDEDealCard } from "@/lib/types/cde";
import { calculateCDEMatchScore } from "@/lib/cde/matchScore";
import AppLayout from "@/components/layout/AppLayout";
import CDEDetailModal from "@/components/cde/CDEDetailModal";
import DealCard from "@/components/DealCard";

// Types
type ProgramType = "NMTC" | "HTC" | "LIHTC" | "OZ";
type ProgramLevel = "federal" | "state";
type DealStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "available"
  | "seeking_capital"
  | "matched"
  | "closing"
  | "closed"
  | "withdrawn";
type TractType = "QCT" | "SD" | "LIC" | "DDA";
type EntityView = "investors" | "cdes" | "deals" | "sponsors";

// Constants - Dark Theme Colors
const PROGRAM_COLORS: Record<ProgramType, string> = {
  NMTC: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
  HTC: "bg-blue-900/50 text-blue-400 border-blue-700",
  LIHTC: "bg-purple-900/50 text-purple-400 border-purple-700",
  OZ: "bg-amber-900/50 text-amber-400 border-amber-700",
};

const LEVEL_COLORS: Record<ProgramLevel, string> = {
  federal: "bg-gray-800 text-gray-300",
  state: "bg-sky-900/50 text-sky-400",
};

const STATUS_COLORS: Record<DealStatus, string> = {
  draft: "bg-gray-700 text-gray-400",
  submitted: "bg-blue-900/50 text-blue-400",
  under_review: "bg-amber-900/50 text-amber-400",
  available: "bg-green-900/50 text-green-400",
  seeking_capital: "bg-indigo-900/50 text-indigo-400",
  matched: "bg-purple-900/50 text-purple-400",
  closing: "bg-teal-900/50 text-teal-400",
  closed: "bg-emerald-900/50 text-emerald-400",
  withdrawn: "bg-gray-800 text-gray-400",
};

const STATUS_LABELS: Record<DealStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under Review",
  available: "Available",
  seeking_capital: "Seeking Capital",
  matched: "Matched",
  closing: "Closing",
  closed: "Closed",
  withdrawn: "Withdrawn",
};

const TRACT_LABELS: Record<TractType, string> = {
  QCT: "Qualified Census Tract",
  SD: "Severely Distressed",
  LIC: "Low-Income Community",
  DDA: "Difficult Development Area",
};

const US_STATES: Record<string, string> = {
  Alabama: "AL",
  Alaska: "AK",
  Arizona: "AZ",
  Arkansas: "AR",
  California: "CA",
  Colorado: "CO",
  Connecticut: "CT",
  Delaware: "DE",
  Florida: "FL",
  Georgia: "GA",
  Hawaii: "HI",
  Idaho: "ID",
  Illinois: "IL",
  Indiana: "IN",
  Iowa: "IA",
  Kansas: "KS",
  Kentucky: "KY",
  Louisiana: "LA",
  Maine: "ME",
  Maryland: "MD",
  Massachusetts: "MA",
  Michigan: "MI",
  Minnesota: "MN",
  Mississippi: "MS",
  Missouri: "MO",
  Montana: "MT",
  Nebraska: "NE",
  Nevada: "NV",
  "New Hampshire": "NH",
  "New Jersey": "NJ",
  "New Mexico": "NM",
  "New York": "NY",
  "North Carolina": "NC",
  "North Dakota": "ND",
  Ohio: "OH",
  Oklahoma: "OK",
  Oregon: "OR",
  Pennsylvania: "PA",
  "Rhode Island": "RI",
  "South Carolina": "SC",
  "South Dakota": "SD",
  Tennessee: "TN",
  Texas: "TX",
  Utah: "UT",
  Vermont: "VT",
  Virginia: "VA",
  Washington: "WA",
  "West Virginia": "WV",
  Wisconsin: "WI",
  Wyoming: "WY",
};

type SortField =
  | "projectName"
  | "sponsorName"
  | "programType"
  | "allocation"
  | "creditPrice"
  | "state"
  | "status"
  | "submittedDate"
  | "organizationName"
  | "remainingAllocation";
type SortDirection = "asc" | "desc";

export default function MarketplacePage() {
  const router = useRouter();

  // Get role configuration
  const {
    orgType,
    orgId,
    marketplace,
    isLoading: authLoading,
  } = useRoleConfig();

  // Data state
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceResult>({
    deals: [],
    cdes: [],
    investors: [],
  });
  const [loading, setLoading] = useState(true);

  // Determine default view based on role
  const getDefaultView = (): EntityView => {
    if (orgType === "sponsor") return "cdes"; // Sponsors see CDEs first
    return "deals"; // CDEs and Investors see deals
  };

  // UI state
  const [activeView, setActiveView] = useState<EntityView>(getDefaultView());
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>("submittedDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [searchQuery, setSearchQuery] = useState("");
  const [programFilter, setProgramFilter] = useState<ProgramType | "all">(
    "all",
  );
  const [levelFilter, setLevelFilter] = useState<ProgramLevel | "all">("all");
  const [statusFilter, setStatusFilter] = useState<DealStatus | "all">("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedCDE, setSelectedCDE] = useState<CDEDealCard | null>(null);
  const [showCDEModal, setShowCDEModal] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const itemsPerPage = 50;

  // Match Criteria state (passed to MapFilterRail sidebar)
  const [matchCriteriaFilters, setMatchCriteriaFilters] = useState<
    Record<string, boolean>
  >({});
  const activeMatchCriteria = Object.entries(matchCriteriaFilters)
    .filter(([, v]) => v)
    .map(([k]) => k);

  const handleMatchCriteriaChange = (criteria: Record<string, boolean>) => {
    setMatchCriteriaFilters(criteria);
    setCurrentPage(1);
  };

  // MapFilterRail state
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(false);
  const [selectedMatchDeal, setSelectedMatchDeal] =
    useState<PipelineDealSummary | null>(null);

  // AutoMatch results state
  const [autoMatchResults, setAutoMatchResults] = useState<
    Map<string, { score: number; reasons: string[] }>
  >(new Map());
  const [autoMatchLoading, setAutoMatchLoading] = useState(false);

  // Get view mode for MapFilterRail based on orgType
  const getViewMode = (): "sponsor" | "cde" | "investor" => {
    if (orgType === "sponsor") return "sponsor";
    if (orgType === "cde") return "cde";
    return "investor";
  };

  // Fetch data based on role
  useEffect(() => {
    async function loadData() {
      if (authLoading) return;
      setLoading(true);
      try {
        const data = await fetchMarketplaceForRole(orgType, orgId);
        setMarketplaceData(data);
        // Update default view based on what data we received
        if (orgType === "sponsor" && data.cdes.length > 0) {
          setActiveView("cdes");
        } else if (data.deals.length > 0) {
          setActiveView("deals");
        }
      } catch (error) {
        console.error("Failed to load marketplace data:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [orgType, orgId, authLoading]);

  // Extract deals, CDEs, and investors from marketplace data
  const { deals, cdes, investors } = marketplaceData;

  // AutoMatch scoring effect - runs when deal is selected
  useEffect(() => {
    if (!autoMatchEnabled || !selectedMatchDeal) {
      setAutoMatchResults(new Map());
      return;
    }

    async function runAutoMatch() {
      setAutoMatchLoading(true);
      console.log("[AutoMatch] Running for deal:", selectedMatchDeal?.id);

      try {
        // Try backend API first
        const response = await fetch("/api/automatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId: selectedMatchDeal?.id,
            minScore: 0, // Get all matches, we'll filter on frontend
            maxResults: 100,
            notifyMatches: false,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.matches && Array.isArray(data.matches)) {
            const resultsMap = new Map<
              string,
              { score: number; reasons: string[] }
            >();
            data.matches.forEach(
              (match: {
                cdeId: string;
                totalScore?: number;
                score?: number;
                reasons?: string[];
              }) => {
                resultsMap.set(match.cdeId, {
                  score: match.totalScore || match.score || 0,
                  reasons: match.reasons || [],
                });
              },
            );
            console.log(
              "[AutoMatch] Backend returned",
              resultsMap.size,
              "matches",
            );
            setAutoMatchResults(resultsMap);
            setAutoMatchLoading(false);
            return;
          }
        }
      } catch (err) {
        console.warn(
          "[AutoMatch] Backend API failed, using client-side scoring:",
          err,
        );
      }

      // Fallback to client-side scoring using BINARY SCORING
      const resultsMap = new Map<
        string,
        { score: number; reasons: string[] }
      >();

      // Try to find full deal data from marketplace deals for richer scoring
      const fullDeal = deals.find((d) => d.id === selectedMatchDeal?.id);

      // Get actual project type — DON'T use programType ("NMTC") as a proxy
      // programType is the credit program, NOT the project type
      const PROGRAM_NAMES = ["nmtc", "htc", "lihtc", "oz", "brownfield"];
      const rawProjectType = fullDeal?.projectType || "";
      const projectType = PROGRAM_NAMES.includes(rawProjectType.toLowerCase())
        ? ""
        : rawProjectType;
      const projectTypeLower = projectType.toLowerCase();

      // Real Estate project types (physical building/facility projects)
      const REAL_ESTATE_TYPES = [
        "community facility",
        "community center",
        "healthcare",
        "medical",
        "clinic",
        "hospital",
        "education",
        "school",
        "charter",
        "housing",
        "residential",
        "affordable",
        "senior",
        "shelter",
        "homeless",
        "rescue",
        "mission",
        "childcare",
        "daycare",
        "industrial",
        "manufacturing",
        "warehouse",
        "retail",
        "commercial",
        "office",
        "mixed use",
        "mixed-use",
        "renovation",
        "construction",
        "development",
        "building",
        "facility",
        "real estate",
      ];
      // If no project type info available, leave isRealEstate undefined (unknown)
      const isRealEstate = projectTypeLower
        ? REAL_ESTATE_TYPES.some((t) => projectTypeLower.includes(t))
        : undefined;

      // Build dealCriteria for BINARY SCORING
      const dealCriteria = {
        state: fullDeal?.state || selectedMatchDeal?.state || "",
        projectType: projectType,
        projectName:
          fullDeal?.projectName || selectedMatchDeal?.projectName || "",
        allocationRequest:
          fullDeal?.allocation || selectedMatchDeal?.allocation || 0,
        severelyDistressed:
          fullDeal?.tractSeverelyDistressed ||
          (fullDeal?.tractType as string[] | undefined)?.includes("SD") ||
          false,
        isQct:
          fullDeal?.tractEligible ||
          (fullDeal?.tractType as string[] | undefined)?.includes("QCT") ||
          false,
        distressScore: fullDeal?.tractSeverelyDistressed
          ? 95
          : fullDeal?.tractEligible
            ? 72
            : 35,
        isRural: fullDeal?.isRural || false,
        isNonProfit:
          fullDeal?.isNonProfit ||
          fullDeal?.organizationType?.toLowerCase().includes("nonprofit") ||
          false,
        isMinorityOwned: fullDeal?.isMinorityOwned || false,
        isOwnerOccupied: fullDeal?.isOwnerOccupied || false,
        isRealEstate: isRealEstate,
        isUts: fullDeal?.isUts || false,
        isTribal: fullDeal?.isTribal || false,
        allocationType: fullDeal?.programLevel || "federal",
      };

      cdes.forEach((cde) => {
        const result = calculateCDEMatchScore(cde, dealCriteria);
        resultsMap.set(cde.id, {
          score: result.score,
          reasons: result.reasons,
        });
      });

      // Debug: show score distribution
      const scoreDist = new Map<number, number>();
      resultsMap.forEach(({ score }) =>
        scoreDist.set(score, (scoreDist.get(score) || 0) + 1),
      );
      console.log(
        "[AutoMatch] Client-side scored",
        resultsMap.size,
        "CDEs. Distribution:",
        Object.fromEntries(scoreDist),
      );
      console.log("[AutoMatch] Deal criteria:", {
        state: dealCriteria.state,
        projectType: dealCriteria.projectType,
        isRealEstate: dealCriteria.isRealEstate,
        allocation: dealCriteria.allocationRequest,
      });
      setAutoMatchResults(resultsMap);
      setAutoMatchLoading(false);
    }

    runAutoMatch();
  }, [autoMatchEnabled, selectedMatchDeal, cdes, deals]);

  // Filter and sort deals using MapFilterRail filters
  const filteredDeals = useMemo(() => {
    let result = deals.filter((d) => d.visible !== false);

    // Text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.projectName.toLowerCase().includes(query) ||
          d.sponsorName.toLowerCase().includes(query) ||
          d.city?.toLowerCase().includes(query) ||
          d.state?.toLowerCase().includes(query),
      );
    }

    // Credit type filter from MapFilterRail
    if (filters.creditTypes.length > 0) {
      result = result.filter((d) => {
        const dealProgram = d.programType.toLowerCase();
        return filters.creditTypes.some(
          (ct) => ct.toLowerCase() === dealProgram,
        );
      });
    }

    // State credits filter
    if (filters.includeStateCredits) {
      // Include state-level programs
    } else {
      // Only federal by default
      if (levelFilter !== "all")
        result = result.filter((d) => d.programLevel === levelFilter);
    }

    // Deal status filters from MapFilterRail
    if (filters.shovelReadyOnly) {
      result = result.filter(
        (d) => d.status === "available" || d.status === "seeking_capital",
      );
    }
    if (filters.seekingAllocation) {
      result = result.filter(
        (d) =>
          d.status === "submitted" ||
          d.status === "under_review" ||
          d.status === "available",
      );
    }
    if (filters.inClosing) {
      result = result.filter((d) => d.status === "closing");
    }

    // Distress level filters
    if (filters.severelyDistressedOnly) {
      result = result.filter((d) => d.tractType?.includes("SD"));
    }
    if (filters.qctOnly) {
      result = result.filter((d) => d.tractType?.includes("QCT"));
    }

    // Area type filter
    if (filters.areaType === "rural") {
      // Filter for rural/non-metro (would need metro_status field)
    } else if (filters.areaType === "urban") {
      // Filter for urban/metro
    }

    // Project type filter
    if (filters.projectTypes.length > 0) {
      // Would filter by project sector/type if available in deal data
    }

    // Allocation range filter
    if (filters.allocationRequest.min) {
      result = result.filter(
        (d) => (d.allocation || 0) >= (filters.allocationRequest.min || 0),
      );
    }
    if (filters.allocationRequest.max) {
      result = result.filter(
        (d) => (d.allocation || 0) <= (filters.allocationRequest.max || 0),
      );
    }

    // State filter (kept from header dropdown)
    if (stateFilter !== "all")
      result = result.filter((d) => d.state === stateFilter);
    if (statusFilter !== "all")
      result = result.filter((d) => d.status === statusFilter);

    // Match Criteria filters (marketplace-only, manual matching)
    if (activeMatchCriteria.length > 0) {
      result = result.filter((d) => {
        for (const key of activeMatchCriteria) {
          switch (key) {
            case "severelyDistressed":
              if (!d.tractSeverelyDistressed && !d.tractType?.includes("SD"))
                return false;
              break;
            case "sector":
              if (!d.projectType) return false;
              break;
            case "dealSize":
              if (!d.allocation || d.allocation <= 0) return false;
              break;
            case "smallDealFund":
              if (d.allocation && d.allocation > 5000000) return false;
              break;
            case "distressPercentile":
              if (!d.tractSeverelyDistressed && !d.tractEligible) return false;
              break;
            case "minorityFocus":
              if (!d.isMinorityOwned && !d.sponsor?.minorityOwned) return false;
              break;
            case "utsFocus":
              if (!d.isUts) return false;
              break;
            case "entityType":
              if (
                !d.organizationType?.toLowerCase().includes("nonprofit") &&
                !d.sponsor?.organizationType
                  ?.toLowerCase()
                  .includes("nonprofit")
              )
                return false;
              break;
            case "ownerOccupied":
              if (
                !d.isOwnerOccupied &&
                !d.ventureType?.toLowerCase().includes("owner")
              )
                return false;
              break;
            case "tribal":
              if (!d.tribalData?.aian && !d.isTribal) return false;
              break;
            case "urbanRural":
              if (
                d.tractClassification?.toLowerCase().includes("rural") ||
                d.isRural
              ) {
                /* rural deal - pass */
              }
              break;
            case "hasAllocation":
              // For deals, this means deal has allocation request
              if (!d.allocation || d.allocation <= 0) return false;
              break;
          }
        }
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = ((a as unknown as Record<string, unknown>)[
        sortField
      ] ?? "") as string | number;
      let bVal: string | number = ((b as unknown as Record<string, unknown>)[
        sortField
      ] ?? "") as string | number;
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    deals,
    searchQuery,
    filters,
    levelFilter,
    statusFilter,
    stateFilter,
    sortField,
    sortDirection,
    activeMatchCriteria,
  ]);

  // Filter CDEs with AutoMatch scoring
  const filteredCDEs = useMemo(() => {
    let result = [...cdes];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.organizationName.toLowerCase().includes(query) ||
          c.missionSnippet?.toLowerCase().includes(query) ||
          c.primaryStates?.some((s) => s.toLowerCase().includes(query)),
      );
    }
    if (stateFilter !== "all") {
      result = result.filter((c) => c.primaryStates?.includes(stateFilter));
    }

    // Match Criteria filters for CDEs (Sponsor manual matching)
    if (activeMatchCriteria.length > 0) {
      result = result.filter((c) => {
        for (const key of activeMatchCriteria) {
          switch (key) {
            case "geographic":
              if (
                c.primaryStates.length === 0 &&
                c.serviceAreaType !== "national"
              )
                return false;
              break;
            case "financing":
              if (!c.predominantFinancing) break; // No preference = pass
              break;
            case "urbanRural":
              if (!c.ruralFocus && !c.urbanFocus) break; // Generalist = pass
              break;
            case "sector":
              if (c.targetSectors.length === 0) break; // Generalist = pass
              break;
            case "smallDealFund":
              if (!c.smallDealFund) return false;
              break;
            case "severelyDistressed":
              if (!c.requireSeverelyDistressed && !c.prefersSeverelyDistressed)
                return false;
              break;
            case "minorityFocus":
              if (!c.minorityFocus) return false;
              break;
            case "utsFocus":
              if (!c.utsFocus) return false;
              break;
            case "entityType":
              if (c.forprofitAccepted === false) break; // Nonprofit-only CDE
              break;
            case "ownerOccupied":
              // Owner-occupied projects qualify for both Real Estate and Business Financing
              // so this filter should NOT exclude any CDEs — it's always compatible
              break;
            case "tribal":
              if (!c.nativeAmericanFocus) return false;
              break;
            case "hasAllocation":
              if ((c.remainingAllocation || 0) <= 0) return false;
              break;
          }
        }
        return true;
      });
    }

    // Sort by AutoMatch score when enabled, otherwise by remaining allocation
    if (autoMatchEnabled && autoMatchResults.size > 0) {
      result.sort((a, b) => {
        const scoreA = autoMatchResults.get(a.id)?.score || 0;
        const scoreB = autoMatchResults.get(b.id)?.score || 0;
        return scoreB - scoreA; // Higher scores first
      });
    } else {
      result.sort(
        (a, b) => (b.remainingAllocation || 0) - (a.remainingAllocation || 0),
      );
    }
    return result;
  }, [
    cdes,
    searchQuery,
    stateFilter,
    autoMatchEnabled,
    autoMatchResults,
    activeMatchCriteria,
  ]);

  // Filter Investors
  const filteredInvestors = useMemo(() => {
    let result = [...investors];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (i) =>
          i.organizationName.toLowerCase().includes(query) ||
          i.programs?.some((p) => p.toLowerCase().includes(query)),
      );
    }
    // Sort by available capital
    result.sort(
      (a, b) => (b.availableCapital || 0) - (a.availableCapital || 0),
    );
    return result;
  }, [investors, searchQuery]);

  // Stats for sidebar
  const _programStats = useMemo(
    () => ({
      nmtc: deals.filter((d) => d.programType === "NMTC").length,
      htc: deals.filter((d) => d.programType === "HTC").length,
      lihtc: deals.filter((d) => d.programType === "LIHTC").length,
      oz: deals.filter((d) => d.programType === "OZ").length,
      federal: deals.filter((d) => d.programLevel === "federal").length,
      state: deals.filter((d) => d.programLevel === "state").length,
    }),
    [deals],
  );

  const uniqueStates = useMemo(() => {
    const dealStates = deals.map((d) => d.state).filter(Boolean);
    const cdeStates = cdes.flatMap((c) => c.primaryStates || []);
    return [...new Set([...dealStates, ...cdeStates])].sort();
  }, [deals, cdes]);

  // Loading state
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Deals...</p>
        </div>
      </div>
    );
  }

  // Get current items based on view
  const getCurrentItems = () => {
    switch (activeView) {
      case "cdes":
        return filteredCDEs;
      case "investors":
        return filteredInvestors;
      case "deals":
      default:
        return filteredDeals;
    }
  };

  const currentItems = getCurrentItems();
  const totalPages = Math.ceil(currentItems.length / itemsPerPage);
  const paginatedItems = currentItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (field: SortField) => {
    if (sortField === field)
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === paginatedItems.length)
      setSelectedItems(new Set());
    else setSelectedItems(new Set(paginatedItems.map((item) => item.id)));
  };

  const handleSelectItem = (id: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedItems(newSelected);
  };

  const clearFilter = (filter: "program" | "level" | "status" | "state") => {
    if (filter === "program") setProgramFilter("all");
    if (filter === "level") setLevelFilter("all");
    if (filter === "status") setStatusFilter("all");
    if (filter === "state") setStateFilter("all");
  };

  const activeFilters = [
    programFilter !== "all" && {
      type: "program",
      label: programFilter,
      value: programFilter,
    },
    levelFilter !== "all" && {
      type: "level",
      label: levelFilter === "federal" ? "Federal" : "State",
      value: levelFilter,
    },
    statusFilter !== "all" && {
      type: "status",
      label: STATUS_LABELS[statusFilter],
      value: statusFilter,
    },
    stateFilter !== "all" && {
      type: "state",
      label: stateFilter,
      value: stateFilter,
    },
  ].filter(Boolean) as { type: string; label: string; value: string }[];

  const SortIcon = ({ field }: { field: SortField }) => (
    <svg
      className={`w-4 h-4 ml-1 inline-block ${sortField === field ? "text-indigo-400" : "text-gray-600"}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      {sortField === field && sortDirection === "asc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      ) : sortField === field && sortDirection === "desc" ? (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      ) : (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      )}
    </svg>
  );

  // Dynamic sidebar items based on role
  const getSidebarItems = () => {
    const items = [];

    // Sponsors see CDEs and Investors first
    if (orgType === "sponsor") {
      items.push(
        {
          id: "cdes",
          label: "CDEs",
          icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
          count: cdes.length,
        },
        {
          id: "investors",
          label: "Investors",
          icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
          count: investors.length,
        },
      );
    } else {
      // CDEs and Investors see deals first
      items.push({
        id: "deals",
        label: "Projects",
        icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
        count: deals.length,
      });
    }

    return items;
  };

  const sidebarItems = getSidebarItems();

  const getViewTitle = () => {
    if (orgType === "sponsor") {
      return activeView === "cdes"
        ? "CDEs with Allocation"
        : "Active Investors";
    }
    return marketplace.title;
  };

  const formatCurrency = (num: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(num);

  // Render CDE cards for sponsors
  const renderCDETable = () => (
    <table className="w-full">
      <thead className="bg-gray-800/50 border-b border-gray-800">
        <tr>
          <th className="px-2 py-2 text-left">
            <input
              type="checkbox"
              checked={
                selectedItems.size === paginatedItems.length &&
                paginatedItems.length > 0
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
            />
          </th>
          <th
            className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("organizationName")}
          >
            CDE
            <SortIcon field="organizationName" />
          </th>
          {autoMatchEnabled && (
            <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Match
            </th>
          )}
          <th
            className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("remainingAllocation")}
          >
            Allocation
            <SortIcon field="remainingAllocation" />
          </th>
          <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Geography
          </th>
          <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Deal Size
          </th>
          <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Type
          </th>
          <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Sectors & Focus
          </th>
          <th className="px-2 py-2 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Preferences
          </th>
          <th className="px-2 py-2"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {(paginatedItems as CDEDealCard[]).map((cde) => {
          const sectors = cde.targetSectors?.length ? cde.targetSectors : [];
          return (
            <tr key={cde.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-2 py-2">
                <input
                  type="checkbox"
                  checked={selectedItems.has(cde.id)}
                  onChange={() => handleSelectItem(cde.id)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
                />
              </td>
              {/* CDE Name — enriched with HQ + allocation type */}
              <td className="px-2 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/50 flex items-center justify-center text-xs font-bold text-emerald-400 flex-shrink-0">
                    {cde.organizationName
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <Link
                      href={`/cde/${cde.id}`}
                      className="text-sm font-medium text-gray-100 hover:text-indigo-400 line-clamp-1"
                    >
                      {cde.organizationName}
                    </Link>
                    {cde.missionSnippet && (
                      <div className="text-[11px] text-gray-500 line-clamp-1">
                        {cde.missionSnippet}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {(cde.headquartersCity || cde.headquartersState) && (
                        <span className="text-[11px] text-gray-500">
                          {[cde.headquartersCity, cde.headquartersState]
                            .filter(Boolean)
                            .join(", ")}
                        </span>
                      )}
                      {cde.allocationType && (
                        <span
                          className={`px-1 py-0 rounded text-[10px] font-medium ${
                            cde.allocationType === "federal"
                              ? "bg-gray-700 text-gray-300"
                              : "bg-sky-900/50 text-sky-400"
                          }`}
                        >
                          {cde.allocationType === "federal" ? "FED" : "STATE"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>
              {/* Match Score */}
              {autoMatchEnabled && (
                <td className="px-2 py-2">
                  {autoMatchLoading ? (
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  ) : autoMatchResults.has(cde.id) ? (
                    <div className="flex flex-col items-start">
                      <span
                        className={`text-lg font-bold ${
                          (autoMatchResults.get(cde.id)?.score || 0) >= 80
                            ? "text-emerald-400"
                            : (autoMatchResults.get(cde.id)?.score || 0) >= 60
                              ? "text-amber-400"
                              : "text-gray-400"
                        }`}
                      >
                        {autoMatchResults.get(cde.id)?.score || 0}%
                      </span>
                      {autoMatchResults.get(cde.id)?.reasons?.[0] && (
                        <span className="text-[10px] text-gray-500 line-clamp-1">
                          {autoMatchResults.get(cde.id)?.reasons?.[0]}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm">—</span>
                  )}
                </td>
              )}
              {/* Allocation — enriched with progress bar + total */}
              <td className="px-2 py-2">
                <div>
                  <span className="text-sm font-medium text-emerald-400">
                    {formatCurrency(cde.remainingAllocation)}
                  </span>
                  {cde.totalAllocation && cde.totalAllocation > 0 && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="flex-1 h-1 bg-gray-800 rounded-full overflow-hidden"
                        style={{ minWidth: 40 }}
                      >
                        <div
                          className="h-full bg-emerald-700 rounded-full"
                          style={{
                            width: `${Math.min(100, ((cde.totalAllocation - cde.remainingAllocation) / cde.totalAllocation) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 whitespace-nowrap">
                        of {formatCurrency(cde.totalAllocation)}
                      </span>
                    </div>
                  )}
                </div>
              </td>
              {/* Geography — type badge + state pills */}
              <td className="px-2 py-2">
                <div>
                  {cde.serviceAreaType && (
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mb-0.5 ${
                        cde.serviceAreaType === "national"
                          ? "bg-blue-900/40 text-blue-300"
                          : cde.serviceAreaType === "regional"
                            ? "bg-purple-900/40 text-purple-300"
                            : "bg-gray-800 text-gray-400"
                      }`}
                    >
                      {cde.serviceAreaType.charAt(0).toUpperCase() +
                        cde.serviceAreaType.slice(1)}
                    </span>
                  )}
                  {cde.primaryStates && cde.primaryStates.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                      {cde.primaryStates.slice(0, 4).map((st) => (
                        <span
                          key={st}
                          className="px-1 py-0 bg-indigo-900/30 text-indigo-300 rounded text-[10px] font-medium"
                        >
                          {st}
                        </span>
                      ))}
                      {cde.primaryStates.length > 4 && (
                        <span className="px-1 py-0 bg-gray-800 text-gray-500 rounded text-[10px]">
                          +{cde.primaryStates.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                  {!cde.serviceAreaType &&
                    !cde.primaryStates?.length &&
                    cde.serviceArea && (
                      <span className="text-[11px] text-gray-400 line-clamp-1">
                        {cde.serviceArea}
                      </span>
                    )}
                </div>
              </td>
              {/* Deal Size */}
              <td className="px-2 py-2 text-xs text-gray-300 whitespace-nowrap">
                {formatCurrency(cde.dealSizeRange?.min || 0)} –{" "}
                {formatCurrency(cde.dealSizeRange?.max || 0)}
              </td>
              {/* Financing Type */}
              <td className="px-2 py-2">
                {cde.predominantFinancing ? (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                      cde.predominantFinancing
                        .toLowerCase()
                        .includes("real estate")
                        ? "bg-teal-900/40 text-teal-300"
                        : "bg-amber-900/40 text-amber-300"
                    }`}
                  >
                    {cde.predominantFinancing
                      .toLowerCase()
                      .includes("real estate")
                      ? "RE"
                      : "Biz"}
                  </span>
                ) : (
                  <span className="text-[11px] text-gray-600">—</span>
                )}
              </td>
              {/* Sectors & Focus — fixed: shows targetSectors + specialFocus instead of raw predominantMarket */}
              <td className="px-2 py-2">
                <div className="flex flex-wrap gap-0.5">
                  {sectors.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="px-1 py-0 bg-purple-900/30 text-purple-300 rounded text-[10px] font-medium line-clamp-1"
                    >
                      {s
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (c) => c.toUpperCase())
                        .slice(0, 14)}
                    </span>
                  ))}
                  {sectors.length > 3 && (
                    <span className="px-1 py-0 bg-gray-800 text-gray-500 rounded text-[10px]">
                      +{sectors.length - 3}
                    </span>
                  )}
                  {cde.specialFocus?.map((sf) => (
                    <span
                      key={sf}
                      className="px-1 py-0 bg-pink-900/30 text-pink-300 rounded text-[10px] font-medium"
                    >
                      {sf.includes("Minority")
                        ? "MBE"
                        : sf.includes("Women")
                          ? "WBE"
                          : sf.includes("Veteran")
                            ? "VET"
                            : sf.slice(0, 5)}
                    </span>
                  ))}
                  {!sectors.length && !cde.specialFocus?.length && (
                    <span className="text-[11px] text-gray-600">—</span>
                  )}
                </div>
              </td>
              {/* Preferences — boolean flag badges */}
              <td className="px-2 py-2">
                <div className="flex flex-wrap gap-0.5">
                  {cde.ruralFocus && (
                    <span
                      className="px-1 py-0 bg-green-900/40 text-green-400 rounded text-[10px] font-medium"
                      title="Rural Focus"
                    >
                      Rural
                    </span>
                  )}
                  {cde.requireSeverelyDistressed && (
                    <span
                      className="px-1 py-0 bg-red-900/40 text-red-400 rounded text-[10px] font-medium"
                      title="Requires Severely Distressed"
                    >
                      SD
                    </span>
                  )}
                  {cde.prefersQct && (
                    <span
                      className="px-1 py-0 bg-orange-900/40 text-orange-400 rounded text-[10px] font-medium"
                      title="Prefers QCT"
                    >
                      QCT
                    </span>
                  )}
                  {cde.smallDealFund && (
                    <span
                      className="px-1 py-0 bg-cyan-900/40 text-cyan-300 rounded text-[10px] font-medium"
                      title="Small Deal Fund (&lt;$5M)"
                    >
                      Small
                    </span>
                  )}
                  {cde.nonprofitPreferred && (
                    <span
                      className="px-1 py-0 bg-purple-900/40 text-purple-300 rounded text-[10px] font-medium"
                      title="Nonprofit Preferred"
                    >
                      NP
                    </span>
                  )}
                  {cde.nativeAmericanFocus && (
                    <span
                      className="px-1 py-0 bg-amber-900/40 text-amber-300 rounded text-[10px] font-medium"
                      title="Native American Focus"
                    >
                      Tribal
                    </span>
                  )}
                  {cde.htcExperience && (
                    <span
                      className="px-1 py-0 bg-blue-900/40 text-blue-300 rounded text-[10px] font-medium"
                      title="HTC Experience"
                    >
                      HTC
                    </span>
                  )}
                  {!cde.ruralFocus &&
                    !cde.requireSeverelyDistressed &&
                    !cde.prefersQct &&
                    !cde.smallDealFund &&
                    !cde.nonprofitPreferred &&
                    !cde.nativeAmericanFocus &&
                    !cde.htcExperience && (
                      <span className="text-[11px] text-gray-600">—</span>
                    )}
                </div>
              </td>
              {/* Action */}
              <td className="px-2 py-2">
                <button
                  onClick={() => {
                    setSelectedCDE(cde);
                    setShowCDEModal(true);
                  }}
                  className="text-indigo-400 hover:text-indigo-300 text-xs font-medium whitespace-nowrap"
                >
                  {marketplace.requestButtonLabel} →
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  // Render Investor cards for sponsors
  const renderInvestorTable = () => (
    <table className="w-full">
      <thead className="bg-gray-800/50 border-b border-gray-800">
        <tr>
          <th className="px-4 py-3 text-left">
            <input
              type="checkbox"
              checked={
                selectedItems.size === paginatedItems.length &&
                paginatedItems.length > 0
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
            />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Investor
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Type
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Programs
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Available Capital
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Investment Range
          </th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {(paginatedItems as InvestorCard[]).map((investor) => (
          <tr
            key={investor.id}
            className="hover:bg-gray-800/50 transition-colors"
          >
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={selectedItems.has(investor.id)}
                onChange={() => handleSelectItem(investor.id)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
              />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-900/50 flex items-center justify-center text-sm font-bold text-blue-400">
                  {investor.organizationName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <Link
                    href={`/investor/${investor.id}`}
                    className="font-medium text-gray-100 hover:text-indigo-400"
                  >
                    {investor.organizationName}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {investor.investorType}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300 capitalize">
                {investor.investorType}
              </span>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {investor.programs?.map((prog) => (
                  <span
                    key={prog}
                    className={`px-2 py-0.5 rounded text-xs font-medium border ${PROGRAM_COLORS[prog as ProgramType] || "bg-gray-800 text-gray-400"}`}
                  >
                    {prog}
                  </span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="font-medium text-blue-400">
                {formatCurrency(investor.availableCapital)}
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-gray-300">
              {formatCurrency(investor.minInvestment)} -{" "}
              {formatCurrency(investor.maxInvestment)}
            </td>
            <td className="px-4 py-3">
              <Link
                href={`/investor/${investor.id}`}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                Request Info →
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render Deal/Project table for CDEs and Investors
  const renderDealTable = () => (
    <table className="w-full">
      <thead className="bg-gray-800/50 border-b border-gray-800">
        <tr>
          <th className="px-4 py-3 text-left">
            <input
              type="checkbox"
              checked={
                selectedItems.size === paginatedItems.length &&
                paginatedItems.length > 0
              }
              onChange={handleSelectAll}
              className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
            />
          </th>
          <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("projectName")}
          >
            Project / Sponsor
            <SortIcon field="projectName" />
          </th>
          <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("programType")}
          >
            Program
            <SortIcon field="programType" />
          </th>
          <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("allocation")}
          >
            {orgType === "cde" ? "QEI Request" : "Allocation"}
            <SortIcon field="allocation" />
          </th>
          {marketplace.showMatchScore && (
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
              Match
            </th>
          )}
          <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("state")}
          >
            Location
            <SortIcon field="state" />
          </th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
            Tract
          </th>
          <th
            className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-800"
            onClick={() => handleSort("status")}
          >
            Status
            <SortIcon field="status" />
          </th>
          <th className="px-4 py-3"></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {(paginatedItems as Deal[]).map((deal) => (
          <tr key={deal.id} className="hover:bg-gray-800/50 transition-colors">
            <td className="px-4 py-3">
              <input
                type="checkbox"
                checked={selectedItems.has(deal.id)}
                onChange={() => handleSelectItem(deal.id)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
              />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                  {deal.sponsorName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <div>
                  <Link
                    href={`/deals/${deal.id}`}
                    className="font-medium text-gray-100 hover:text-indigo-400"
                  >
                    {deal.projectName}
                  </Link>
                  <div className="text-sm text-gray-500">
                    {deal.sponsorName}
                  </div>
                </div>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-col gap-1">
                <span
                  className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${PROGRAM_COLORS[deal.programType]}`}
                >
                  {deal.programType}
                </span>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs ${LEVEL_COLORS[deal.programLevel]}`}
                >
                  {deal.programLevel === "federal"
                    ? "Federal"
                    : deal.stateProgram || "State"}
                </span>
              </div>
            </td>
            <td className="px-4 py-3">
              <span className="font-medium text-gray-100">
                ${((deal.allocation || 0) / 1000000).toFixed(1)}M
              </span>
            </td>
            {marketplace.showMatchScore && (
              <td className="px-4 py-3">
                {deal.matchScore && (
                  <span
                    className={`text-lg font-bold ${
                      deal.matchScore >= 90
                        ? "text-green-400"
                        : deal.matchScore >= 80
                          ? "text-yellow-400"
                          : deal.matchScore >= 70
                            ? "text-orange-400"
                            : "text-red-400"
                    }`}
                  >
                    {deal.matchScore}
                  </span>
                )}
              </td>
            )}
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-6 bg-gray-800 rounded flex items-center justify-center text-xs font-bold text-gray-400">
                  {US_STATES[deal.state] ||
                    deal.state?.slice(0, 2).toUpperCase()}
                </span>
                <span className="text-sm text-gray-300">
                  {deal.city}, {deal.state}
                </span>
              </div>
            </td>
            <td className="px-4 py-3">
              <div className="flex flex-wrap gap-1">
                {deal.tractType?.map((tract) => (
                  <span
                    key={tract}
                    className={`px-1.5 py-0.5 rounded text-xs ${tract === "SD" ? "bg-red-900/50 text-red-400" : "bg-gray-800 text-gray-400"}`}
                    title={TRACT_LABELS[tract]}
                  >
                    {tract}
                  </span>
                ))}
              </div>
            </td>
            <td className="px-4 py-3">
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[deal.status]}`}
              >
                {STATUS_LABELS[deal.status]}
              </span>
            </td>
            <td className="px-4 py-3">
              <Link
                href={`/deals/${deal.id}`}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                {marketplace.requestButtonLabel} →
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // Render Deal/Project cards using DealCard component
  const renderDealCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
      {(paginatedItems as Deal[]).map((deal) => (
        <DealCard
          key={deal.id}
          deal={deal}
          visibilityTier={
            orgType === "cde"
              ? "expanded"
              : orgType === "investor"
                ? "full"
                : "public"
          }
        />
      ))}
    </div>
  );

  // Render appropriate table based on active view
  const renderTable = () => {
    switch (activeView) {
      case "cdes":
        return renderCDETable();
      case "investors":
        return renderInvestorTable();
      case "deals":
      default:
        return viewMode === "cards" ? renderDealCards() : renderDealTable();
    }
  };

  return (
    <AppLayout>
      <div className="h-full bg-gray-950 flex">
        {/* Left Sidebar - MapFilterRail */}
        {!sidebarCollapsed ? (
          <MapFilterRail
            viewMode={getViewMode()}
            filters={filters}
            onFiltersChange={setFilters}
            autoMatchEnabled={autoMatchEnabled}
            onAutoMatchToggle={setAutoMatchEnabled}
            onClose={() => setSidebarCollapsed(true)}
            selectedDealId={selectedMatchDeal?.id || null}
            onDealSelect={(deal) => {
              setSelectedMatchDeal(deal);
              // Auto-enable AutoMatch when deal is selected
              if (deal) setAutoMatchEnabled(true);
            }}
            matchCriteria={matchCriteriaFilters}
            onMatchCriteriaChange={handleMatchCriteriaChange}
          />
        ) : (
          <aside className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col">
            <div className="p-3 border-b border-gray-800 flex flex-col items-center gap-2">
              <Logo variant="icon" size="sm" />
              <button
                onClick={() => router.push("/dashboard")}
                className="p-2 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Back to Dashboard"
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id as EntityView);
                    setCurrentPage(1);
                  }}
                  className={`w-full flex items-center justify-center p-2.5 rounded-lg transition-colors ${activeView === item.id ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white"}`}
                  title={item.label}
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
                      d={item.icon}
                    />
                  </svg>
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-gray-800">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                title="Expand filters"
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
                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col pb-16">
          <header className="bg-gray-900 border-b border-gray-800 px-4 py-3 sticky top-0 z-30">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-gray-100">
                  {getViewTitle()}
                </h1>
                {/* AutoMatch Status Indicator */}
                {autoMatchEnabled && activeView === "cdes" && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-900/50 border border-indigo-700 rounded-lg">
                    {autoMatchLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-indigo-300">
                          Scoring CDEs...
                        </span>
                      </>
                    ) : selectedMatchDeal ? (
                      <>
                        <svg
                          className="w-4 h-4 text-indigo-400"
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
                        <span className="text-xs text-indigo-300">
                          AutoMatch:{" "}
                          {selectedMatchDeal.projectName?.slice(0, 20) ||
                            "Deal selected"}
                        </span>
                      </>
                    ) : (
                      <>
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        <span className="text-xs text-amber-300">
                          Select a deal in sidebar to score CDEs
                        </span>
                      </>
                    )}
                  </div>
                )}
                {activeFilters.length > 0 && (
                  <div className="flex items-center gap-2">
                    {activeFilters.map((filter) => (
                      <span
                        key={filter.type}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-900/50 text-indigo-300 rounded-full text-xs font-medium"
                      >
                        {filter.label}
                        <button
                          onClick={() =>
                            clearFilter(
                              filter.type as
                                | "program"
                                | "level"
                                | "status"
                                | "state",
                            )
                          }
                          className="hover:bg-indigo-800 rounded-full p-0.5"
                        >
                          <svg
                            className="w-3 h-3"
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
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex-1 max-w-xl">
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeView === "cdes" ? "CDEs" : activeView === "investors" ? "investors" : "projects"}...`}
                    className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* View Mode Toggle - Only for deals view */}
                {activeView === "deals" && (
                  <div className="flex items-center bg-gray-800 rounded-lg p-1 border border-gray-700">
                    <button
                      onClick={() => setViewMode("cards")}
                      className={`p-2 rounded-md transition-colors ${viewMode === "cards" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
                      title="Card View"
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
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`p-2 rounded-md transition-colors ${viewMode === "table" ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
                      title="Table View"
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
                          d="M4 6h16M4 10h16M4 14h16M4 18h16"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {activeView === "deals" && (
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as DealStatus | "all")
                    }
                    className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="under_review">Under Review</option>
                    <option value="matched">Matched</option>
                    <option value="closing">Closing</option>
                  </select>
                )}

                <select
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">All States</option>
                  {uniqueStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>

                {orgType === "sponsor" && (
                  <Link
                    href="/dashboard/intake"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
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
                    Submit Project
                  </Link>
                )}
              </div>
            </div>
          </header>

          <div className="flex-1 p-4 overflow-auto">
            {currentItems.length === 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
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
                  No Results Found
                </h3>
                <p className="text-gray-500">{marketplace.emptyStateMessage}</p>
              </div>
            ) : activeView === "deals" && viewMode === "cards" ? (
              /* Card Grid View for Deals */
              <div>
                {renderDealCards()}
                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between bg-gray-900 rounded-b-xl">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, currentItems.length)}{" "}
                    of {currentItems.length} {activeView}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Table View for CDEs, Investors, and Deal table view */
              <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">{renderTable()}</div>

                <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, currentItems.length)}{" "}
                    of {currentItems.length} {activeView}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    <span className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages || 1}
                    </span>
                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="px-3 py-1 border border-gray-700 rounded-lg text-sm text-gray-400 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <MarketplaceFooter />
      </div>

      {/* CDE Detail Modal */}
      <CDEDetailModal
        isOpen={showCDEModal}
        onClose={() => {
          setShowCDEModal(false);
          setSelectedCDE(null);
        }}
        cde={selectedCDE}
      />
    </AppLayout>
  );
}
