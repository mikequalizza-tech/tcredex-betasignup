"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import DealCard from "@/components/DealCard";
import { Deal, ProgramType } from "@/lib/data/deals";
import CDECard from "@/components/CDECard";
import InvestorCard from "@/components/InvestorCard";
import MapFilterRail, {
  FilterState,
  defaultFilters,
} from "@/components/maps/MapFilterRail";
import {
  fetchDeals,
  fetchCDEs,
  fetchDealsByOrganization,
} from "@/lib/supabase/queries";
import { fetchInvestors, InvestorData } from "@/lib/supabase/investorQueries";
import { calculateCDEMatchScore } from "@/lib/cde/matchScore";
import { CDEDealCard } from "@/lib/types/cde";
import { InvestorCard as InvestorCardType } from "@/lib/types/investor";
import { useCurrentUser } from "@/lib/auth";
import { mapDealToCard } from "@/lib/utils/dealCardMapper";
import AppLayout from "@/components/layout/AppLayout";
import { VisibilityTier } from "@/lib/roles/config";

// Sub-view types for each role
type SponsorView = "discover" | "pipeline";
type CDEView = "browse" | "pipeline";
type InvestorView = "browse" | "pipeline";

// Determine visibility tier based on user role and authentication status
function getVisibilityTier(
  isAuthenticated: boolean,
  orgType: string | undefined,
): VisibilityTier {
  if (!isAuthenticated) return "public";
  // CDEs and Investors viewing deals get expanded visibility
  if (orgType === "cde" || orgType === "investor") return "expanded";
  // Sponsors viewing the map (looking at CDEs/Investors) get public view of deals
  return "public";
}

// Dynamic import of the map to avoid SSR issues
const HomeMapWithTracts = dynamic(
  () => import("@/components/maps/HomeMapWithTracts"),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-gray-400">Loading map...</p>
        </div>
      </div>
    ),
  },
);

type ViewMode = "sponsor" | "cde" | "investor";

// Fallback coordinates if none exist
const DEAL_COORDINATES: Record<string, [number, number]> = {
  D12345: [-89.6501, 39.7817],
  D12346: [-83.0458, 42.3314],
  D12347: [-76.6122, 39.2904],
  D12348: [-81.6944, 41.4993],
  D12349: [-90.049, 35.1495],
  D12350: [-90.1994, 38.627],
};

interface SearchedTract {
  coordinates: [number, number];
  geoid: string;
  address?: string;
}

export default function MapPlatformPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading Marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Suspense
        fallback={
          <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <MapContent />
      </Suspense>
    </AppLayout>
  );
}

const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || amount === 0) return "N/A";
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
};

function MapContent() {
  const searchParams = useSearchParams();
  const {
    isAuthenticated,
    orgType,
    organizationId,
    userName,
    orgName,
    isLoading: authLoading,
  } = useCurrentUser();
  const visibilityTier = getVisibilityTier(isAuthenticated, orgType);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [autoMatchEnabled, setAutoMatchEnabled] = useState(false);
  const [searchedTract, setSearchedTract] = useState<SearchedTract | null>(
    null,
  );
  const [showFilterRail, setShowFilterRail] = useState(true);
  const [showDealPanel, setShowDealPanel] = useState(true);

  // Check for automatch query parameter and enable if present
  useEffect(() => {
    if (searchParams?.get("automatch") === "true") {
      setAutoMatchEnabled(true);
    }
  }, [searchParams]);

  // Role-specific view toggles: browse vs pipeline
  const [sponsorView, setSponsorView] = useState<SponsorView>("discover");
  const [cdeView, setCdeView] = useState<CDEView>("browse");
  const [investorView, setInvestorView] = useState<InvestorView>("browse");

  const [deals, setDeals] = useState<Deal[]>([]);
  const [cdes, setCDEs] = useState<CDEDealCard[]>([]);
  const [investors, setInvestors] = useState<InvestorCardType[]>([]);
  const [myDeals, setMyDeals] = useState<Deal[]>([]); // Sponsor's own deals
  const [pipelineDeals, setPipelineDeals] = useState<Deal[]>([]); // CDE/Investor pipeline deals
  const [dataLoading, setDataLoading] = useState(true);

  // Capital source toggle: CDEs or Investors (sponsor discover view)
  const [capitalSourceView, setCapitalSourceView] = useState<
    "cdes" | "investors"
  >("cdes");

  // AutoMatch: Selected deal for Sponsors to match CDEs against
  const [selectedMatchDeal, setSelectedMatchDeal] = useState<Deal | null>(null);

  // Backend AutoMatch results
  const [autoMatchResults, setAutoMatchResults] = useState<
    Map<string, { score: number; reasons: string[] }>
  >(new Map());
  const [autoMatchLoading, setAutoMatchLoading] = useState(false);
  const [autoMatchError, setAutoMatchError] = useState<string | null>(null);

  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Submission modal state
  const [submitModalCDE, setSubmitModalCDE] = useState<CDEDealCard | null>(
    null,
  );
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedCDEIds, setSubmittedCDEIds] = useState<Set<string>>(
    new Set(),
  );
  const [mapDealPickStep, setMapDealPickStep] = useState(false); // show deal picker when no deal pre-selected

  // Email preview state (for map Submit Project flow)
  const [mapPreviewStep, setMapPreviewStep] = useState(false);
  const [mapPreviewHtml, setMapPreviewHtml] = useState("");
  const [mapPreviewSubject, setMapPreviewSubject] = useState("");
  const [mapPreviewContactEmail, setMapPreviewContactEmail] = useState("");
  const [mapPreviewLoading, setMapPreviewLoading] = useState(false);
  const [mapSubmitSuccess, setMapSubmitSuccess] = useState(false);
  const mapIframeRef = useRef<HTMLIFrameElement>(null);

  // Write preview HTML into iframe when it changes
  useEffect(() => {
    if (mapPreviewHtml && mapIframeRef.current) {
      const doc = mapIframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(mapPreviewHtml);
        doc.close();
      }
    }
  }, [mapPreviewHtml]);

  const cardListRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // === FIX: ALL HOOKS MUST BE BEFORE ANY RETURN STATEMENT ===

  // 1. Move useCallback UP here
  const handleTractFound = useCallback(
    (
      tract: { geoid: string },
      coordinates: [number, number],
      address?: string,
    ) => {
      setSearchedTract({ coordinates, geoid: tract.geoid, address });
    },
    [],
  );

  // 2. Move useEffect (scroll) UP here
  useEffect(() => {
    if (selectedId && cardRefs.current.has(selectedId)) {
      cardRefs.current
        .get(selectedId)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedId]);

  // 3. Backend AutoMatch API integration
  useEffect(() => {
    // Only run if AutoMatch is enabled and a deal is selected
    if (!autoMatchEnabled || !selectedMatchDeal?.id) {
      setAutoMatchResults(new Map());
      setAutoMatchError(null);
      return;
    }

    async function runBackendAutoMatch() {
      setAutoMatchLoading(true);
      setAutoMatchError(null);

      try {
        console.log(
          "[AutoMatch] Calling backend API for deal:",
          selectedMatchDeal!.id,
        );

        // Call the backend AutoMatch API
        const response = await fetch("/api/automatch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealId: selectedMatchDeal!.id,
            minScore: 0, // Get all matches, we'll filter on frontend
            maxResults: 500,
            notifyMatches: false,
          }),
        });

        console.log("[AutoMatch] Backend response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("[AutoMatch] Backend error response:", errorData);
          throw new Error(
            errorData.error || `AutoMatch failed: ${response.status}`,
          );
        }

        const data = await response.json();

        // Transform backend results into a Map<cdeId, { score, reasons }>
        const resultsMap = new Map<
          string,
          { score: number; reasons: string[] }
        >();

        // Backend returns { success: boolean, data: { matches: MatchScore[] } }
        // MatchScore has: cdeId, cdeName, totalScore, breakdown, matchStrength, reasons
        const responseData = data.data || data;
        const matches =
          responseData.matches || responseData.results || responseData || [];

        if (Array.isArray(matches)) {
          matches.forEach(
            (match: {
              cdeId?: string;
              cde_id?: string;
              id?: string;
              totalScore?: number;
              score?: number;
              matchScore?: number;
              reasons?: string[];
              cdeName?: string;
              matchStrength?: string;
            }) => {
              const cdeId = match.cdeId || match.cde_id || match.id;
              // Backend uses totalScore, fallback to score/matchScore for compatibility
              const score =
                match.totalScore ?? match.score ?? match.matchScore ?? 0;
              const reasons = match.reasons || [];
              // Add match strength as a reason if available
              if (match.matchStrength) {
                reasons.unshift(`${match.matchStrength} match`);
              }
              if (cdeId) {
                resultsMap.set(cdeId, { score, reasons });
              }
            },
          );
        }

        setAutoMatchResults(resultsMap);

        if (resultsMap.size === 0) {
          console.warn(
            "[AutoMatch] Backend returned 0 matches - check if deal is NMTC and state matches CDEs",
          );
          // For NMTC deals with no backend matches, this might indicate:
          // 1. Non-NMTC deal (LIHTC/HTC/OZ skip CDE matching)
          // 2. State not served by any CDE
          // 3. Deal doesn't meet CDE criteria (QCT/distress requirements)
          setAutoMatchError("No CDE matches found for this deal");
        }

        console.log(
          `[AutoMatch] Backend returned ${resultsMap.size} matches for deal ${selectedMatchDeal!.id}`,
          responseData,
        );
      } catch (error) {
        console.error("[AutoMatch] Backend API error:", error);
        setAutoMatchError(
          error instanceof Error ? error.message : "AutoMatch failed",
        );
        // Keep existing client-side results as fallback
      } finally {
        setAutoMatchLoading(false);
      }
    }

    runBackendAutoMatch();
  }, [autoMatchEnabled, selectedMatchDeal]);

  // 4. Data fetch — runs ONCE after auth resolves (guard prevents re-fetch on auth re-renders)
  const dataLoadedRef = useRef(false);
  useEffect(() => {
    // Wait for auth to settle before loading data
    if (authLoading) return;
    // Only load once — prevents re-fetch on Supabase session refresh
    if (dataLoadedRef.current) return;
    dataLoadedRef.current = true;

    async function loadData() {
      setDataLoading(true);
      try {
        const promises: Promise<unknown>[] = [
          fetchDeals(),
          fetchCDEs(),
          fetchInvestors(),
        ];

        // If sponsor, also fetch their own deals for Pipeline view
        if (orgType === "sponsor" && organizationId) {
          promises.push(fetchDealsByOrganization(organizationId));
        }

        const results = await Promise.all(promises);
        const [fetchedDeals, fetchedCDEs, fetchedInvestors, sponsorDeals] =
          results as [
            Deal[],
            CDEDealCard[],
            InvestorData[],
            Deal[] | undefined,
          ];

        const mappedDeals = fetchedDeals.map((d) => mapDealToCard(d));
        setDeals(mappedDeals);
        setCDEs(fetchedCDEs);

        // Map InvestorData → InvestorCardType
        const mappedInvestors: InvestorCardType[] = (
          fetchedInvestors || []
        ).map((inv) => ({
          id: inv.id,
          organizationId: inv.slug,
          organizationName: inv.name,
          primaryContactName: inv.primaryContact,
          primaryContactEmail: inv.contactEmail,
          primaryContactPhone: inv.contactPhone,
          investorType: inv.investorType,
          craMotivated: false,
          accredited: true,
          minInvestment: inv.minInvestment,
          maxInvestment: inv.maxInvestment,
          targetCreditTypes: (inv.programs || []) as ProgramType[],
          targetStates: inv.geographicFocus || [],
          targetSectors: inv.projectPreferences || [],
          totalInvestments: inv.dealsCompleted,
          totalInvested: inv.totalInvested,
          status: inv.activelyInvesting
            ? ("active" as const)
            : ("inactive" as const),
        }));
        setInvestors(mappedInvestors);

        if (sponsorDeals) {
          setMyDeals(sponsorDeals.map((d) => mapDealToCard(d)));
        }

        // For CDEs and Investors: filter deals that are in their pipeline
        // Pipeline = deals with status: under_review, matched, closing, or deals they've interacted with
        if (orgType === "cde" || orgType === "investor") {
          const pipelineStatuses = [
            "under_review",
            "matched",
            "closing",
            "loi_received",
            "committed",
          ];
          const pipeline = mappedDeals.filter((d) =>
            pipelineStatuses.includes(d.status || ""),
          );
          setPipelineDeals(pipeline);
        }
      } catch (error) {
        console.error("Failed to load data from Supabase:", error);
      } finally {
        setDataLoading(false);
      }
    }
    loadData();
  }, [authLoading, orgType, organizationId]);

  // Helper function to apply filters to deals
  const applyDealFilters = useCallback(
    (dealList: Deal[]) => {
      return dealList.filter((deal) => {
        // Shovel ready filter
        if (filters.shovelReadyOnly && !deal.shovelReady) return false;

        // Project cost range filter
        const cost = deal.projectCost || 0;
        if (cost < filters.minProjectCost || cost > filters.maxProjectCost)
          return false;

        // Allocation range filter
        const allocation = deal.allocation || 0;
        if (
          allocation < filters.minAllocation ||
          allocation > filters.maxAllocation
        )
          return false;

        // Credit types filter - check program type
        if (filters.creditTypes.length > 0) {
          const programType = deal.programType?.toLowerCase();
          if (!filters.creditTypes.some((ct) => ct === programType))
            return false;
        }

        // State filter
        if (filters.states.length > 0 && !filters.states.includes(deal.state))
          return false;

        // Area type filter
        if (filters.areaType !== "all") {
          // Rural typically means non-metro areas
          const isRural =
            deal.censusTract && deal.povertyRate && deal.povertyRate > 20;
          if (filters.areaType === "rural" && !isRural) return false;
          if (filters.areaType === "urban" && isRural) return false;
        }

        // Severely distressed filter
        if (filters.severelyDistressedOnly) {
          const isSeverelyDistressed =
            (deal.povertyRate && deal.povertyRate >= 30) ||
            (deal.unemployment && deal.unemployment >= 10);
          if (!isSeverelyDistressed) return false;
        }

        // Deal status filters
        if (
          filters.seekingAllocation &&
          deal.status !== "submitted" &&
          deal.status !== "available"
        ) {
          // Only show if explicitly enabled and matches
        }
        if (filters.inClosing && deal.status !== "closing") {
          // Only filter if this is the sole status selected
        }

        return true;
      });
    },
    [filters],
  );

  // Helper function to apply filters to CDEs
  const applyCDEFilters = useCallback(
    (cdeList: CDEDealCard[]) => {
      return cdeList.filter((cde) => {
        // Status filter - only show active
        if (cde.status !== "active") return false;

        // Minimum allocation remaining filter (for sponsors)
        if (
          filters.cdeMinAllocationRemaining &&
          cde.remainingAllocation < filters.cdeMinAllocationRemaining
        ) {
          return false;
        }

        // State filter - match if CDE serves any of the selected states
        if (filters.states.length > 0) {
          const cdeStates = cde.primaryStates || [];
          // National CDEs (no specific states) pass, or must have overlap
          if (
            cdeStates.length > 0 &&
            !cdeStates.some((s) => filters.states.includes(s))
          ) {
            return false;
          }
        }

        // Area type filter
        if (filters.areaType !== "all") {
          if (filters.areaType === "rural" && !cde.ruralFocus) return false;
          if (filters.areaType === "urban" && !cde.urbanFocus) return false;
        }

        // Severely distressed requirement
        if (filters.severelyDistressedOnly && !cde.requireSeverelyDistressed)
          return false;

        // Project type match
        if (filters.projectTypes.length > 0) {
          const cdeTargetSectors = cde.targetSectors || [];
          // Pass if CDE has no specific sectors OR has matching sectors
          if (cdeTargetSectors.length > 0) {
            const hasMatch = filters.projectTypes.some((pt) =>
              cdeTargetSectors.some((ts) =>
                ts.toLowerCase().includes(pt.toLowerCase()),
              ),
            );
            if (!hasMatch) return false;
          }
        }

        // CDE impact themes filter
        if (filters.cdeImpactThemes && filters.cdeImpactThemes.length > 0) {
          const cdeImpact = cde.impactPriorities || [];
          // Cast to string for comparison since both are essentially string-based
          const cdeImpactStrings = cdeImpact as string[];
          if (
            !filters.cdeImpactThemes.some((theme) =>
              cdeImpactStrings.includes(theme),
            )
          ) {
            return false;
          }
        }

        return true;
      });
    },
    [filters],
  );

  // ==========================================================

  // VIEW MODE IS LOCKED TO USER TYPE - No switcher!
  const viewMode: ViewMode =
    orgType === "cde" ? "cde" : orgType === "investor" ? "investor" : "sponsor";

  // CONDITIONAL RETURN: Safe to return now because all hooks are registered above
  if (authLoading || dataLoading) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // DATA PREPARATION (Runs only after loading is done)
  // ============================================

  const mapDeals = deals.map((deal) => ({
    ...deal,
    coordinates: deal.coordinates || DEAL_COORDINATES[deal.id] || undefined,
  }));

  // Apply comprehensive filters to deals
  const filteredDeals = applyDealFilters(mapDeals);

  // Apply comprehensive filters to CDEs
  // When AutoMatch is enabled AND a deal is selected, use backend scores (with client-side fallback)
  const filteredCDEs = applyCDEFilters(cdes)
    .map((cde) => {
      const shouldMatch = autoMatchEnabled && selectedMatchDeal;

      // Check if we have backend results for this CDE
      const backendResult = autoMatchResults.get(cde.id);

      let score: number | undefined;
      let reasons: string[] = [];

      if (shouldMatch) {
        if (backendResult) {
          // Use backend score (authoritative)
          score = backendResult.score;
          reasons = backendResult.reasons;
        } else if (!autoMatchLoading && autoMatchResults.size > 0) {
          // Backend ran but this CDE wasn't in results - low/no match
          score = 0;
          reasons = ["No match from AutoMatch engine"];
        } else if (autoMatchLoading) {
          // Still loading from backend
          score = undefined;
          reasons = [];
        } else {
          // Backend not available or error - use client-side fallback with binary scoring
          const state = selectedMatchDeal.state || "";
          const projectType = selectedMatchDeal.projectType || "";
          const projectTypeLower = projectType.toLowerCase();
          const allocationRequest = selectedMatchDeal.allocation || 0;
          const severelyDistressed =
            selectedMatchDeal.tractSeverelyDistressed ||
            (selectedMatchDeal.povertyRate || 0) >= 30;

          // Infer isRealEstate from project type keywords
          // When project type is unknown, leave as undefined → financing gate gives benefit of doubt
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
          const ventureTypeLower = (
            selectedMatchDeal.ventureType || ""
          ).toLowerCase();
          let isRealEstate: boolean | undefined = undefined;
          if (
            ventureTypeLower.includes("real estate") ||
            ventureTypeLower === "real estate"
          ) {
            isRealEstate = true;
          } else if (
            ventureTypeLower.includes("business") ||
            ventureTypeLower.includes("operating")
          ) {
            isRealEstate = false;
          } else if (projectTypeLower) {
            isRealEstate = REAL_ESTATE_TYPES.some((t) =>
              projectTypeLower.includes(t),
            )
              ? true
              : undefined;
          }

          // Determine other binary criteria
          const isQct = selectedMatchDeal.tractType?.includes("QCT") || false;
          const distressScore = selectedMatchDeal.povertyRate || 0;
          const isRural = false; // Would need tract data to determine
          const isNonProfit =
            selectedMatchDeal.organizationType === "nonprofit" ||
            selectedMatchDeal.sponsor?.organizationType === "nonprofit";
          const isMinorityOwned =
            selectedMatchDeal.sponsor?.minorityOwned || false;
          const isOwnerOccupied = false; // Default - would need specific data
          const isUts = false; // Default - would need specific data
          const isTribal = selectedMatchDeal.tribalData?.aian === 1 || false;
          const allocationType = "federal"; // Default for NMTC

          const dealCriteria = {
            state,
            projectType,
            allocationRequest,
            severelyDistressed,
            isQct,
            distressScore,
            isRural,
            isNonProfit,
            isMinorityOwned,
            isOwnerOccupied,
            isRealEstate,
            isUts,
            isTribal,
            allocationType,
          };

          const clientResult = calculateCDEMatchScore(cde, dealCriteria);
          score = clientResult.score;
          reasons = [...clientResult.reasons, "(client-side estimate)"];
        }
      }

      return {
        ...cde,
        matchScore: shouldMatch ? score : undefined,
        matchReasons: shouldMatch ? reasons : undefined,
      };
    })
    .sort((a, b) => {
      if (
        autoMatchEnabled &&
        selectedMatchDeal &&
        a.matchScore !== undefined &&
        b.matchScore !== undefined
      ) {
        return b.matchScore - a.matchScore;
      }
      return b.remainingAllocation - a.remainingAllocation;
    });

  // Filter investors (basic geo + program matching)
  const filteredInvestors = investors
    .filter((inv) => {
      if (inv.status !== "active") return false;
      // State filter
      if (filters.states && filters.states.length > 0) {
        const hasStateMatch =
          inv.targetStates.length === 0 ||
          inv.targetStates.some((s) => filters.states.includes(s));
        if (!hasStateMatch) return false;
      }
      return true;
    })
    .map((inv) => {
      // Geo match scoring for investors
      if (!selectedMatchDeal) return inv;
      let score = 0;
      const reasons: string[] = [];
      const dealState = selectedMatchDeal.state || "";
      // State match
      if (
        inv.targetStates.length === 0 ||
        inv.targetStates.includes(dealState)
      ) {
        score += 40;
        reasons.push(
          inv.targetStates.length === 0
            ? "National investor"
            : `Invests in ${dealState}`,
        );
      }
      // Program match
      const dealProgram = selectedMatchDeal.programType || "NMTC";
      if (
        inv.targetCreditTypes.length === 0 ||
        inv.targetCreditTypes.includes(dealProgram as ProgramType)
      ) {
        score += 30;
        reasons.push(`Targets ${dealProgram} deals`);
      }
      // CRA motivated bonus
      if (inv.craMotivated) {
        score += 15;
        reasons.push("CRA-motivated investor");
      }
      // Active investor bonus
      if (inv.status === "active") {
        score += 15;
        reasons.push("Actively investing");
      }
      return { ...inv, matchScore: score, matchReasons: reasons };
    })
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const handleSelectCard = (id: string | null) => setSelectedId(id);

  const handleRequestMemo = (dealId: string) => {
    // Navigate to deal detail page where role-specific actions are available
    window.location.href = `/deals/${dealId}`;
  };

  const handleRequestCDEMatch = (cdeId: string) => {
    const cde = filteredCDEs.find((c) => c.id === cdeId);
    if (!cde) return;
    if (!selectedMatchDeal) {
      // No deal selected yet — open modal with deal picker step
      setSubmitModalCDE(cde);
      setMapDealPickStep(true);
      setSubmitMessage("");
      setSubmitError(null);
      return;
    }
    setSubmitModalCDE(cde);
    setMapDealPickStep(false);
    setSubmitMessage("");
    setSubmitError(null);
  };

  // Load email preview before sending
  const handlePreviewSubmit = async () => {
    if (!submitModalCDE || !selectedMatchDeal) return;
    setMapPreviewLoading(true);
    setMapPreviewStep(true);
    setMapPreviewHtml("");
    setSubmitError(null);

    try {
      const res = await fetch(
        `/api/deals/${selectedMatchDeal.id}/outreach/preview`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientOrgId: submitModalCDE.organizationId || submitModalCDE.id,
            senderOrgId: organizationId,
            senderName: userName,
            senderOrg: orgName,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to generate preview");
        setMapPreviewLoading(false);
        return;
      }

      setMapPreviewHtml(data.html);
      setMapPreviewSubject(data.subject);
      setMapPreviewContactEmail(data.contactEmail || "");
    } catch {
      setSubmitError("Failed to load preview");
    } finally {
      setMapPreviewLoading(false);
    }
  };

  const handleConfirmSubmit = async () => {
    if (!submitModalCDE || !selectedMatchDeal) return;
    setSubmitLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch(
        `/api/deals/${selectedMatchDeal.id}/outreach`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientIds: [submitModalCDE.organizationId || submitModalCDE.id],
            recipientType: "cde",
            message:
              submitMessage ||
              `Submitting ${selectedMatchDeal.projectName} for your review.`,
            senderId: organizationId,
            senderOrgId: organizationId,
            senderName: userName,
            senderOrg: orgName,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || data.success === false || data.sent === 0) {
        setSubmitError(data.error || "Failed to submit");
        return;
      }

      // Mark this CDE as submitted and show success
      setSubmittedCDEIds((prev) => new Set([...prev, submitModalCDE.id]));
      setMapSubmitSuccess(true);
    } catch {
      setSubmitError("Network error — please try again");
    } finally {
      setSubmitLoading(false);
    }
  };

  const totalProjectValue = filteredDeals.reduce(
    (sum, d) => sum + (d.projectCost || 0),
    0,
  );

  // When AutoMatch is enabled, only count CDEs with good match scores (60+)
  const matchingCDEs =
    autoMatchEnabled && autoMatchResults.size > 0
      ? filteredCDEs.filter(
          (c) => (autoMatchResults.get(c.id)?.score || c.matchScore || 0) >= 60,
        )
      : filteredCDEs;
  const totalCDEAllocation = matchingCDEs.reduce(
    (sum, c) => sum + c.remainingAllocation,
    0,
  );
  const shovelReadyCount = filteredDeals.filter((d) => d.shovelReady).length;
  const activeCDECount =
    autoMatchEnabled && autoMatchResults.size > 0
      ? matchingCDEs.length
      : filteredCDEs.length;

  const getPanelInfo = () => {
    switch (viewMode) {
      case "sponsor":
        if (sponsorView === "pipeline") {
          return {
            title: "My Pipeline",
            count: myDeals.length,
            subtitle: "Your deals in progress",
          };
        }
        // When AutoMatch is active, show matched CDE count instead of all filtered CDEs
        if (capitalSourceView === "investors") {
          return {
            title: "Investors",
            count: filteredInvestors.length,
            subtitle: "Find investors for your project",
          };
        }
        if (autoMatchEnabled && autoMatchResults.size > 0) {
          return {
            title: "Matching CDEs",
            count: matchingCDEs.length,
            subtitle: `${autoMatchResults.size} CDEs scored by AI`,
          };
        }
        return {
          title: "CDEs with Allocation",
          count: filteredCDEs.length,
          subtitle: "Find CDEs matching your project",
        };
      case "cde":
        return {
          title: "Projects Seeking Allocation",
          count: filteredDeals.length,
          subtitle: "Deals matching your criteria",
        };
      case "investor":
        return {
          title: "Investment Opportunities",
          count: filteredDeals.length,
          subtitle: "Deals in closing",
        };
    }
  };

  const panelInfo = getPanelInfo();

  // Pipeline stage colors
  const stageColors: Record<string, string> = {
    draft: "bg-gray-600",
    submitted: "bg-blue-600",
    under_review: "bg-amber-600",
    available: "bg-purple-600",
    seeking_capital: "bg-indigo-600",
    matched: "bg-green-600",
    closing: "bg-emerald-600",
    closed: "bg-green-700",
  };

  const stageLabels: Record<string, string> = {
    draft: "Draft",
    submitted: "Submitted",
    under_review: "Under Review",
    available: "Available",
    seeking_capital: "Seeking Capital",
    matched: "Matched",
    closing: "Closing",
    closed: "Closed",
  };

  return (
    <div className="h-full w-full bg-gray-950 text-white overflow-hidden flex flex-col">
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Filter Rail */}
        <div
          className={`absolute left-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out ${showFilterRail ? "translate-x-0" : "-translate-x-full"}`}
        >
          <MapFilterRail
            viewMode={viewMode}
            filters={filters}
            onFiltersChange={setFilters}
            onTractFound={handleTractFound}
            autoMatchEnabled={autoMatchEnabled}
            onAutoMatchToggle={setAutoMatchEnabled}
            onClose={() => setShowFilterRail(false)}
            selectedDealId={selectedMatchDeal?.id || null}
            onDealSelect={(deal) => {
              if (deal) {
                // Find full deal from myDeals to get ALL fields for scoring
                const fullDeal = myDeals.find((d) => d.id === deal.id);
                if (fullDeal) {
                  setSelectedMatchDeal(fullDeal);
                } else {
                  // Fallback to minimal object if not found
                  setSelectedMatchDeal({
                    id: deal.id,
                    projectName: deal.projectName,
                    city: deal.city,
                    state: deal.state,
                    status: deal.status as Deal["status"],
                    programType: deal.programType,
                    allocation: deal.allocation,
                  } as Deal);
                }
                // Auto-enable AutoMatch when deal is selected
                setAutoMatchEnabled(true);
              } else {
                setSelectedMatchDeal(null);
              }
            }}
          />
        </div>

        {/* Center: Map */}
        <div className="flex-1 h-full relative">
          <HomeMapWithTracts
            height="100%"
            className="w-full h-full"
            // LOGIC: If Sponsor, hide deals, show Allocation Money.
            // If CDE/Investor, show Deal Pins.
            deals={viewMode === "sponsor" ? [] : mapDeals}
            allocations={viewMode === "sponsor" ? filteredCDEs : []}
            searchedLocation={
              searchedTract
                ? {
                    lat: searchedTract.coordinates[1],
                    lng: searchedTract.coordinates[0],
                    tract: searchedTract.geoid,
                    address: searchedTract.address,
                  }
                : null
            }
          />

          {/* Map Overlay Controls - Top Left */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            {!showFilterRail && (
              <button
                onClick={() => setShowFilterRail(true)}
                className="px-3 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
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
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                Filters
              </button>
            )}
          </div>

          {/* Map Overlay Controls - Top Right */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button
              onClick={() => setShowDealPanel(!showDealPanel)}
              className="px-3 py-2 bg-gray-900/90 hover:bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 flex items-center gap-2 transition-colors"
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
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
              {showDealPanel ? "Hide Panel" : "Show Panel"}
            </button>
          </div>

          {/* Stats Bar */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center pointer-events-none z-10">
            <div className="flex gap-6 px-6 py-3 bg-gray-900/90 border border-gray-700 rounded-xl pointer-events-auto">
              {viewMode === "sponsor" ? (
                sponsorView === "pipeline" ? (
                  // Pipeline stats
                  <>
                    <div className="text-center">
                      <p className="text-lg font-bold text-indigo-400">
                        {myDeals.length}
                      </p>
                      <p className="text-xs text-gray-500">My Deals</p>
                    </div>
                    <div className="w-px bg-gray-700" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-amber-400">
                        {
                          myDeals.filter(
                            (d) =>
                              d.status === "seeking_capital" ||
                              d.status === "matched",
                          ).length
                        }
                      </p>
                      <p className="text-xs text-gray-500">Active</p>
                    </div>
                    <div className="w-px bg-gray-700" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-400">
                        {
                          myDeals.filter(
                            (d) =>
                              d.status === "closing" || d.status === "closed",
                          ).length
                        }
                      </p>
                      <p className="text-xs text-gray-500">Closing/Closed</p>
                    </div>
                  </>
                ) : capitalSourceView === "investors" ? (
                  // Discover Investors stats
                  <>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-400">
                        {filteredInvestors.length}
                      </p>
                      <p className="text-xs text-gray-500">Active Investors</p>
                    </div>
                    <div className="w-px bg-gray-700" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-400">
                        {
                          filteredInvestors.filter((i) =>
                            i.targetCreditTypes.includes("NMTC" as ProgramType),
                          ).length
                        }
                      </p>
                      <p className="text-xs text-gray-500">NMTC Investors</p>
                    </div>
                  </>
                ) : (
                  // Discover CDEs stats
                  <>
                    <div className="text-center">
                      <p className="text-lg font-bold text-purple-400">
                        {activeCDECount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {autoMatchEnabled && autoMatchResults.size > 0
                          ? "Matching CDEs"
                          : "Active CDEs"}
                      </p>
                    </div>
                    <div className="w-px bg-gray-700" />
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-400">
                        ${(totalCDEAllocation / 1000000).toFixed(0)}M
                      </p>
                      <p className="text-xs text-gray-500">
                        {autoMatchEnabled && autoMatchResults.size > 0
                          ? "Matching Allocation"
                          : "Available Allocation"}
                      </p>
                    </div>
                  </>
                )
              ) : (
                <>
                  <div className="text-center">
                    <p className="text-lg font-bold text-white">
                      {filteredDeals.length}
                    </p>
                    <p className="text-xs text-gray-500">Projects</p>
                  </div>
                  <div className="w-px bg-gray-700" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-400">
                      ${(totalProjectValue / 1000000).toFixed(0)}M
                    </p>
                    <p className="text-xs text-gray-500">Total Value</p>
                  </div>
                  <div className="w-px bg-gray-700" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-amber-400">
                      {shovelReadyCount}
                    </p>
                    <p className="text-xs text-gray-500">Shovel Ready</p>
                  </div>
                </>
              )}
              {autoMatchEnabled && (
                <>
                  <div className="w-px bg-gray-700" />
                  <div className="text-center flex items-center gap-2">
                    {autoMatchLoading ? (
                      <>
                        <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs text-indigo-400">
                          Running AutoMatch...
                        </p>
                      </>
                    ) : autoMatchError ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <p className="text-xs text-amber-400">Fallback mode</p>
                      </>
                    ) : selectedMatchDeal ? (
                      <>
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <p className="text-xs text-green-400">
                          {autoMatchResults.size > 0
                            ? `${matchingCDEs.length} qualified of ${autoMatchResults.size} scored`
                            : `Matching: ${selectedMatchDeal.projectName.slice(0, 15)}...`}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="w-2 h-2 rounded-full bg-amber-500" />
                        <p className="text-xs text-amber-400">
                          Select deal to match
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Card Panel */}
        <div
          className={`absolute right-0 top-0 bottom-0 z-20 transition-transform duration-300 ease-in-out ${showDealPanel ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="w-96 h-full flex flex-col bg-gray-950 border-l border-gray-800">
            {/* Panel Header */}
            <div className="flex-none px-4 py-3 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-gray-200">
                    {panelInfo.title}
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      ({panelInfo.count})
                    </span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {panelInfo.subtitle}
                  </p>
                </div>
                <button
                  onClick={() => setShowDealPanel(false)}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Sponsor View Tabs */}
            {viewMode === "sponsor" && (
              <div className="flex-none border-b border-gray-800">
                <div className="flex">
                  <button
                    onClick={() => setSponsorView("discover")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      sponsorView === "discover"
                        ? "bg-green-600/20 text-green-400 border-b-2 border-green-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Discover CDEs
                    </div>
                  </button>
                  <button
                    onClick={() => setSponsorView("pipeline")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      sponsorView === "pipeline"
                        ? "bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      My Pipeline ({myDeals.length})
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Capital Source Toggle: CDEs / Investors (Sponsor Discover view) */}
            {viewMode === "sponsor" && sponsorView === "discover" && (
              <div className="flex-none px-4 py-2 border-b border-gray-800 bg-gray-900/50">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">Capital Source</span>
                  <div className="flex items-center bg-gray-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setCapitalSourceView("cdes")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        capitalSourceView === "cdes"
                          ? "bg-purple-600 text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      CDEs ({filteredCDEs.length})
                    </button>
                    <button
                      onClick={() => setCapitalSourceView("investors")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                        capitalSourceView === "investors"
                          ? "bg-blue-600 text-white shadow-sm"
                          : "text-gray-400 hover:text-gray-200"
                      }`}
                    >
                      Investors ({filteredInvestors.length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* CDE View Tabs */}
            {viewMode === "cde" && (
              <div className="flex-none border-b border-gray-800">
                <div className="flex">
                  <button
                    onClick={() => setCdeView("browse")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      cdeView === "browse"
                        ? "bg-purple-600/20 text-purple-400 border-b-2 border-purple-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Browse Projects
                    </div>
                  </button>
                  <button
                    onClick={() => setCdeView("pipeline")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      cdeView === "pipeline"
                        ? "bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      My Pipeline ({pipelineDeals.length})
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Investor View Tabs */}
            {viewMode === "investor" && (
              <div className="flex-none border-b border-gray-800">
                <div className="flex">
                  <button
                    onClick={() => setInvestorView("browse")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      investorView === "browse"
                        ? "bg-emerald-600/20 text-emerald-400 border-b-2 border-emerald-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
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
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      Browse Deals
                    </div>
                  </button>
                  <button
                    onClick={() => setInvestorView("pipeline")}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                      investorView === "pipeline"
                        ? "bg-indigo-600/20 text-indigo-400 border-b-2 border-indigo-500"
                        : "text-gray-400 hover:text-gray-300 hover:bg-gray-800/50"
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
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
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      My Pipeline ({pipelineDeals.length})
                    </div>
                  </button>
                </div>
              </div>
            )}
            {/* Sponsor AutoMatch: Deal Selector */}
            {viewMode === "sponsor" &&
              autoMatchEnabled &&
              sponsorView === "discover" && (
                <div className="flex-none p-3 border-b border-gray-800 bg-indigo-950/30">
                  <label className="text-xs text-indigo-300 block mb-2 font-medium">
                    Match CDEs to your deal:
                  </label>
                  {myDeals.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">
                      No deals in your pipeline.{" "}
                      <Link
                        href="/deals/new"
                        className="text-indigo-400 hover:text-indigo-300"
                      >
                        Submit a project
                      </Link>{" "}
                      first.
                    </p>
                  ) : (
                    <select
                      value={selectedMatchDeal?.id || ""}
                      onChange={(e) => {
                        const deal = myDeals.find(
                          (d) => d.id === e.target.value,
                        );
                        setSelectedMatchDeal(deal || null);
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Select a deal to match...</option>
                      {myDeals.map((deal) => (
                        <option key={deal.id} value={deal.id}>
                          {deal.projectName} ({deal.city}, {deal.state})
                        </option>
                      ))}
                    </select>
                  )}
                  {selectedMatchDeal && (
                    <div className="mt-2 p-2 bg-gray-800/50 rounded-lg">
                      <p className="text-xs text-gray-400">
                        Matching CDEs for:{" "}
                        <span className="text-indigo-300 font-medium">
                          {selectedMatchDeal.projectName}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        $
                        {(
                          (selectedMatchDeal.allocation || 0) / 1000000
                        ).toFixed(1)}
                        M • {selectedMatchDeal.state}
                      </p>
                      {autoMatchLoading && (
                        <p className="text-xs text-indigo-400 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                          Running AI AutoMatch engine...
                        </p>
                      )}
                      {!autoMatchLoading && autoMatchResults.size > 0 && (
                        <p className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          {matchingCDEs.length} matching CDEs (
                          {autoMatchResults.size} scored)
                        </p>
                      )}
                      {!autoMatchLoading && autoMatchError && (
                        <p className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                          <span className="w-2 h-2 bg-amber-500 rounded-full" />
                          Using estimate scores (backend unavailable)
                        </p>
                      )}
                    </div>
                  )}
                  {autoMatchEnabled &&
                    !selectedMatchDeal &&
                    myDeals.length > 0 && (
                      <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
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
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                        Select a deal to see ranked CDEs
                      </p>
                    )}
                </div>
              )}
            {viewMode === "cde" && autoMatchEnabled && (
              <div className="flex-none p-3 border-b border-gray-800 bg-purple-950/30">
                <p className="text-xs text-purple-300">
                  <span className="font-semibold">AutoMatch AI:</span> Deals
                  ranked by your CDE criteria
                </p>
              </div>
            )}
            {viewMode === "investor" && (
              <div className="flex-none p-3 border-b border-gray-800 bg-blue-950/30">
                <p className="text-xs text-blue-300">
                  <span className="font-semibold">Investor View:</span>{" "}
                  CRA-eligible deals with projected returns
                </p>
              </div>
            )}

            {/* Card List */}
            <div
              ref={cardListRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {viewMode === "sponsor" ? (
                // SPONSOR VIEW
                sponsorView === "pipeline" ? (
                  // PIPELINE SUB-VIEW: Show sponsor's own deals
                  myDeals.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="w-12 h-12 text-gray-700 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        No deals in your pipeline yet
                      </p>
                      <Link
                        href="/deals/new"
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors"
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
                  ) : (
                    // Pipeline deal cards
                    myDeals.map((deal) => (
                      <Link
                        key={deal.id}
                        href={`/deals/${deal.id}`}
                        className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-100 truncate">
                              {deal.projectName}
                            </h3>
                            <p className="text-sm text-gray-400 mt-0.5">
                              {deal.city}, {deal.state}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full text-white ${stageColors[deal.status] || "bg-gray-600"}`}
                          >
                            {stageLabels[deal.status] || deal.status}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Allocation:</span>
                            <span className="ml-1 text-gray-300">
                              ${((deal.allocation || 0) / 1000000).toFixed(1)}M
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Project Cost:</span>
                            <span className="ml-1 text-gray-300">
                              ${((deal.projectCost || 0) / 1000000).toFixed(1)}M
                            </span>
                          </div>
                        </div>

                        {/* Progress indicator */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="text-gray-400">
                              {deal.status === "draft"
                                ? "10%"
                                : deal.status === "submitted"
                                  ? "25%"
                                  : deal.status === "under_review"
                                    ? "40%"
                                    : deal.status === "available"
                                      ? "55%"
                                      : deal.status === "seeking_capital"
                                        ? "70%"
                                        : deal.status === "matched"
                                          ? "85%"
                                          : deal.status === "closing"
                                            ? "95%"
                                            : "100%"}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${stageColors[deal.status] || "bg-gray-600"}`}
                              style={{
                                width:
                                  deal.status === "draft"
                                    ? "10%"
                                    : deal.status === "submitted"
                                      ? "25%"
                                      : deal.status === "under_review"
                                        ? "40%"
                                        : deal.status === "available"
                                          ? "55%"
                                          : deal.status === "seeking_capital"
                                            ? "70%"
                                            : deal.status === "matched"
                                              ? "85%"
                                              : deal.status === "closing"
                                                ? "95%"
                                                : "100%",
                              }}
                            />
                          </div>
                        </div>
                      </Link>
                    ))
                  )
                ) : capitalSourceView === "investors" ? (
                  // DISCOVER SUB-VIEW: Show Investor Cards
                  filteredInvestors.length === 0 ? (
                    <div className="text-center py-12">
                      <svg
                        className="w-12 h-12 text-gray-700 mx-auto mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-500 text-sm">
                        No investors found
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Investors will appear here as they join the platform
                      </p>
                    </div>
                  ) : (
                    filteredInvestors.map((investor) => {
                      const isExpanded = expandedCardId === investor.id;
                      return (
                        <div
                          key={investor.id}
                          ref={(el) => {
                            if (el) cardRefs.current.set(investor.id, el);
                          }}
                          onClick={() => {
                            setExpandedCardId(isExpanded ? null : investor.id);
                            handleSelectCard(investor.id);
                          }}
                          className={`cursor-pointer transition-all duration-200 ${selectedId === investor.id ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-950 rounded-xl" : ""}`}
                        >
                          {isExpanded ? (
                            <div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedCardId(null);
                                }}
                                className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-t-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-750 transition-colors"
                              >
                                <span className="font-medium">
                                  {investor.organizationName}
                                </span>
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
                                    d="M5 15l7-7 7 7"
                                  />
                                </svg>
                              </button>
                              <InvestorCard investor={investor} />
                            </div>
                          ) : (
                            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                              <div className="flex items-center gap-3">
                                {/* Match score badge */}
                                {investor.matchScore !== undefined && (
                                  <div
                                    className={`flex-shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center ${
                                      investor.matchScore >= 80
                                        ? "bg-green-900/50 border border-green-700"
                                        : investor.matchScore >= 60
                                          ? "bg-amber-900/50 border border-amber-700"
                                          : "bg-gray-800 border border-gray-700"
                                    }`}
                                  >
                                    <span
                                      className={`text-sm font-bold leading-none ${
                                        investor.matchScore >= 80
                                          ? "text-green-400"
                                          : investor.matchScore >= 60
                                            ? "text-amber-400"
                                            : "text-gray-400"
                                      }`}
                                    >
                                      {investor.matchScore}
                                    </span>
                                    <span className="text-[9px] text-gray-500">
                                      %
                                    </span>
                                  </div>
                                )}
                                {investor.matchScore === undefined && (
                                  <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-blue-900/50 border border-blue-800 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-400">
                                      {investor.organizationName
                                        .split(" ")
                                        .map((w) => w[0])
                                        .join("")
                                        .slice(0, 2)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-sm font-semibold text-gray-100 truncate">
                                    {investor.organizationName}
                                  </h3>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {investor.investorType && (
                                      <span className="text-xs text-blue-400 font-medium capitalize">
                                        {investor.investorType.replace(
                                          "_",
                                          " ",
                                        )}
                                      </span>
                                    )}
                                    {investor.craMotivated && (
                                      <span className="text-[10px] px-1 bg-green-900/40 text-green-300 rounded">
                                        CRA
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {investor.targetCreditTypes
                                      ?.slice(0, 4)
                                      .map((prog) => (
                                        <span
                                          key={prog}
                                          className="px-1 py-0 bg-blue-900/40 text-blue-300 rounded text-[9px]"
                                        >
                                          {prog}
                                        </span>
                                      ))}
                                    {investor.targetStates
                                      ?.slice(0, 3)
                                      .map((st) => (
                                        <span
                                          key={st}
                                          className="px-1 py-0 bg-gray-800 text-gray-400 rounded text-[9px]"
                                        >
                                          {st}
                                        </span>
                                      ))}
                                    {investor.targetStates &&
                                      investor.targetStates.length > 3 && (
                                        <span className="text-[9px] text-gray-500">
                                          +{investor.targetStates.length - 3}
                                        </span>
                                      )}
                                  </div>
                                </div>
                                <svg
                                  className="w-4 h-4 text-gray-600 flex-shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                  />
                                </svg>
                              </div>
                              {investor.matchReasons &&
                                investor.matchReasons.length > 0 && (
                                  <p className="text-[10px] text-blue-400 mt-1.5 truncate pl-14">
                                    {investor.matchReasons[0]}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : // DISCOVER SUB-VIEW: Show CDE Cards
                filteredCDEs.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-12 h-12 text-gray-700 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      No CDEs match your filters
                    </p>
                    <button
                      onClick={() => setFilters(defaultFilters)}
                      className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      Reset filters
                    </button>
                  </div>
                ) : (
                  filteredCDEs.map((cde) => {
                    const isExpanded = expandedCardId === cde.id;
                    return (
                      <div
                        key={cde.id}
                        ref={(el) => {
                          if (el) cardRefs.current.set(cde.id, el);
                        }}
                        onClick={() => {
                          setExpandedCardId(isExpanded ? null : cde.id);
                          handleSelectCard(cde.id);
                        }}
                        className={`cursor-pointer transition-all duration-200 ${selectedId === cde.id ? "ring-2 ring-purple-500 ring-offset-2 ring-offset-gray-950 rounded-xl" : ""}`}
                      >
                        {isExpanded ? (
                          /* Expanded: full CDECard with collapse bar */
                          <div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setExpandedCardId(null);
                              }}
                              className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-t-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-750 transition-colors"
                            >
                              <span className="font-medium">
                                {cde.organizationName}
                              </span>
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
                                  d="M5 15l7-7 7 7"
                                />
                              </svg>
                            </button>
                            <CDECard
                              cde={cde}
                              onRequestMatch={handleRequestCDEMatch}
                              matchRequested={submittedCDEIds.has(cde.id)}
                            />
                          </div>
                        ) : (
                          /* Collapsed: compact stacked row */
                          <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                            <div className="flex items-center gap-3">
                              {/* Match score badge */}
                              {cde.matchScore !== undefined && (
                                <div
                                  className={`flex-shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center ${
                                    cde.matchScore >= 80
                                      ? "bg-green-900/50 border border-green-700"
                                      : cde.matchScore >= 60
                                        ? "bg-amber-900/50 border border-amber-700"
                                        : "bg-gray-800 border border-gray-700"
                                  }`}
                                >
                                  <span
                                    className={`text-sm font-bold leading-none ${
                                      cde.matchScore >= 80
                                        ? "text-green-400"
                                        : cde.matchScore >= 60
                                          ? "text-amber-400"
                                          : "text-gray-400"
                                    }`}
                                  >
                                    {cde.matchScore}
                                  </span>
                                  <span className="text-[9px] text-gray-500">
                                    %
                                  </span>
                                </div>
                              )}
                              {/* CDE initials badge when no match score */}
                              {cde.matchScore === undefined && (
                                <div className="flex-shrink-0 w-11 h-11 rounded-lg bg-indigo-900/50 border border-indigo-800 flex items-center justify-center">
                                  <span className="text-sm font-bold text-indigo-400">
                                    {cde.organizationName
                                      .split(" ")
                                      .map((w) => w[0])
                                      .join("")
                                      .slice(0, 2)}
                                  </span>
                                </div>
                              )}
                              {/* Name + details */}
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-gray-100 truncate">
                                  {cde.organizationName}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-emerald-400 font-medium">
                                    {formatCurrency(cde.remainingAllocation)}
                                  </span>
                                  {cde.dealSizeRange &&
                                    (cde.dealSizeRange.min > 0 ||
                                      cde.dealSizeRange.max > 0) && (
                                      <span className="text-[10px] text-gray-500">
                                        {formatCurrency(cde.dealSizeRange.min)}-
                                        {formatCurrency(cde.dealSizeRange.max)}
                                      </span>
                                    )}
                                </div>
                                {/* State pills + type badges */}
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {cde.serviceAreaType && (
                                    <span
                                      className={`px-1 py-0 rounded text-[9px] font-medium ${
                                        cde.serviceAreaType === "national"
                                          ? "bg-blue-900/40 text-blue-300"
                                          : cde.serviceAreaType === "regional"
                                            ? "bg-purple-900/40 text-purple-300"
                                            : "bg-gray-800 text-gray-400"
                                      }`}
                                    >
                                      {cde.serviceAreaType === "national"
                                        ? "Natl"
                                        : cde.serviceAreaType === "regional"
                                          ? "Reg"
                                          : cde.serviceAreaType}
                                    </span>
                                  )}
                                  {cde.primaryStates?.slice(0, 3).map((st) => (
                                    <span
                                      key={st}
                                      className="px-1 py-0 bg-gray-800 text-gray-400 rounded text-[9px]"
                                    >
                                      {st}
                                    </span>
                                  ))}
                                  {cde.primaryStates &&
                                    cde.primaryStates.length > 3 && (
                                      <span className="text-[9px] text-gray-500">
                                        +{cde.primaryStates.length - 3}
                                      </span>
                                    )}
                                  {cde.ruralFocus && (
                                    <span className="px-1 py-0 bg-green-900/40 text-green-400 rounded text-[9px]">
                                      Rural
                                    </span>
                                  )}
                                  {cde.smallDealFund && (
                                    <span className="px-1 py-0 bg-cyan-900/40 text-cyan-300 rounded text-[9px]">
                                      Small
                                    </span>
                                  )}
                                </div>
                              </div>
                              {/* Expand indicator */}
                              <svg
                                className="w-4 h-4 text-gray-600 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            </div>
                            {/* Match reasons preview (top 1) */}
                            {cde.matchReasons &&
                              cde.matchReasons.length > 0 && (
                                <p className="text-[10px] text-green-400 mt-1.5 truncate pl-14">
                                  {cde.matchReasons[0]}
                                </p>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )
              ) : // CDE/INVESTOR VIEW
              (viewMode === "cde" && cdeView === "pipeline") ||
                (viewMode === "investor" && investorView === "pipeline") ? (
                // PIPELINE VIEW: Show deals in pipeline
                pipelineDeals.length === 0 ? (
                  <div className="text-center py-12">
                    <svg
                      className="w-12 h-12 text-gray-700 mx-auto mb-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p className="text-gray-500 text-sm">
                      No deals in your pipeline yet
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Browse projects and request to review to add them to your
                      pipeline
                    </p>
                  </div>
                ) : (
                  pipelineDeals.map((deal) => (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.id}`}
                      className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-100 truncate">
                            {deal.projectName}
                          </h3>
                          <p className="text-sm text-gray-400 mt-0.5">
                            {deal.city}, {deal.state}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full text-white ${stageColors[deal.status] || "bg-gray-600"}`}
                        >
                          {stageLabels[deal.status] || deal.status}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500">Allocation:</span>
                          <span className="ml-1 text-gray-300">
                            ${((deal.allocation || 0) / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Program:</span>
                          <span className="ml-1 text-gray-300">
                            {deal.programType || "NMTC"}
                          </span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Stage</span>
                          <span className="text-gray-400">
                            {stageLabels[deal.status] || deal.status}
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${stageColors[deal.status] || "bg-gray-600"}`}
                            style={{
                              width:
                                (deal.status as string) === "under_review"
                                  ? "40%"
                                  : (deal.status as string) === "matched"
                                    ? "60%"
                                    : (deal.status as string) === "loi_received"
                                      ? "70%"
                                      : (deal.status as string) === "committed"
                                        ? "85%"
                                        : (deal.status as string) === "closing"
                                          ? "95%"
                                          : "30%",
                            }}
                          />
                        </div>
                      </div>
                    </Link>
                  ))
                )
              ) : // BROWSE VIEW: Show Deal Cards
              filteredDeals.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="w-12 h-12 text-gray-700 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-gray-500 text-sm">
                    No projects match your filters
                  </p>
                  <button
                    onClick={() => setFilters(defaultFilters)}
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                filteredDeals.map((deal) => {
                  const isDealExpanded = expandedCardId === deal.id;
                  return (
                    <div
                      key={deal.id}
                      ref={(el) => {
                        if (el) cardRefs.current.set(deal.id, el);
                      }}
                      onClick={() => {
                        setExpandedCardId(isDealExpanded ? null : deal.id);
                        handleSelectCard(deal.id);
                      }}
                      className={`cursor-pointer transition-all duration-200 ${selectedId === deal.id ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-950 rounded-xl" : ""}`}
                    >
                      {isDealExpanded ? (
                        /* Expanded: full DealCard with collapse bar */
                        <div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCardId(null);
                            }}
                            className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-t-xl text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-750 transition-colors"
                          >
                            <span className="font-medium">
                              {deal.projectName}
                            </span>
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
                                d="M5 15l7-7 7 7"
                              />
                            </svg>
                          </button>
                          <DealCard
                            deal={deal}
                            onRequestMemo={handleRequestMemo}
                            visibilityTier={visibilityTier}
                          />
                        </div>
                      ) : (
                        /* Collapsed: compact row with key deal info */
                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 hover:border-gray-700 transition-colors">
                          <div className="flex items-center gap-3">
                            {/* Program badge */}
                            <div
                              className={`flex-shrink-0 w-11 h-11 rounded-lg flex flex-col items-center justify-center ${
                                deal.programType === "NMTC"
                                  ? "bg-emerald-900/50 border border-emerald-700"
                                  : deal.programType === "HTC"
                                    ? "bg-blue-900/50 border border-blue-700"
                                    : deal.programType === "LIHTC"
                                      ? "bg-purple-900/50 border border-purple-700"
                                      : deal.programType === "OZ"
                                        ? "bg-amber-900/50 border border-amber-700"
                                        : "bg-gray-800 border border-gray-700"
                              }`}
                            >
                              <span
                                className={`text-xs font-bold leading-none ${
                                  deal.programType === "NMTC"
                                    ? "text-emerald-400"
                                    : deal.programType === "HTC"
                                      ? "text-blue-400"
                                      : deal.programType === "LIHTC"
                                        ? "text-purple-400"
                                        : deal.programType === "OZ"
                                          ? "text-amber-400"
                                          : "text-gray-400"
                                }`}
                              >
                                {deal.programType}
                              </span>
                            </div>
                            {/* Name + details */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-semibold text-gray-100 truncate">
                                {deal.projectName}
                              </h3>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-xs text-gray-400">
                                  {deal.city}, {deal.state}
                                </span>
                                {deal.allocation > 0 && (
                                  <span className="text-xs text-emerald-400 font-medium">
                                    ${(deal.allocation / 1000000).toFixed(1)}M
                                  </span>
                                )}
                              </div>
                              {/* Status + tract badges */}
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span
                                  className={`px-1 py-0 rounded text-[9px] font-medium ${
                                    deal.status === "available"
                                      ? "bg-teal-900/40 text-teal-300"
                                      : deal.status === "seeking_capital"
                                        ? "bg-indigo-900/40 text-indigo-300"
                                        : deal.status === "matched"
                                          ? "bg-purple-900/40 text-purple-300"
                                          : "bg-gray-800 text-gray-400"
                                  }`}
                                >
                                  {(deal.status || "").replace(/_/g, " ")}
                                </span>
                                {deal.tractType
                                  ?.slice(0, 2)
                                  .map((tt: string) => (
                                    <span
                                      key={tt}
                                      className={`px-1 py-0 rounded text-[9px] ${
                                        tt === "SD"
                                          ? "bg-red-900/40 text-red-400"
                                          : "bg-gray-800 text-gray-400"
                                      }`}
                                    >
                                      {tt}
                                    </span>
                                  ))}
                              </div>
                            </div>
                            {/* Expand indicator */}
                            <svg
                              className="w-4 h-4 text-gray-600 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 9l-7 7-7-7"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ SUBMISSION MODAL — deal pick → compose → preview → send ============ */}
      {submitModalCDE && (selectedMatchDeal || mapDealPickStep) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            className={`bg-gray-900 border border-gray-700 rounded-2xl mx-4 shadow-2xl overflow-hidden transition-all ${mapPreviewStep ? "w-full max-w-3xl max-h-[90vh]" : "w-full max-w-md"}`}
          >
            {mapDealPickStep && !selectedMatchDeal ? (
              /* Step 0: Deal Picker — shown when no deal was pre-selected */
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-1">
                  Select a Deal
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Choose which project to submit to{" "}
                  <span className="text-purple-400 font-medium">
                    {submitModalCDE.organizationName}
                  </span>
                </p>

                {myDeals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-gray-500"
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
                    <p className="text-gray-400 mb-3">
                      You don&apos;t have any deals yet.
                    </p>
                    <a
                      href="/deals/new"
                      className="text-indigo-400 hover:text-indigo-300 font-medium text-sm"
                    >
                      Submit a Deal First &rarr;
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                    {myDeals.map((deal) => (
                      <button
                        key={deal.id}
                        onClick={() => {
                          setSelectedMatchDeal(deal);
                          setMapDealPickStep(false);
                        }}
                        className="w-full text-left p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-indigo-500/50 rounded-lg transition-colors"
                      >
                        <p className="font-semibold text-white">
                          {deal.projectName}
                        </p>
                        <p className="text-sm text-gray-400">
                          {deal.city}
                          {deal.state ? `, ${deal.state}` : ""}
                          {deal.programs?.[0] ? ` · ${deal.programs[0]}` : ""}
                          {deal.allocation
                            ? ` · ${formatCurrency(deal.allocation)}`
                            : ""}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitModalCDE(null);
                      setMapDealPickStep(false);
                      setSubmitError(null);
                    }}
                    className="w-full px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : !mapPreviewStep ? (
              /* Step 1: Compose */
              <div className="p-6">
                <h3 className="text-lg font-bold text-white mb-1">
                  Submit Project
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Send{" "}
                  <span className="text-indigo-400 font-medium">
                    {selectedMatchDeal!.projectName}
                  </span>{" "}
                  to{" "}
                  <span className="text-purple-400 font-medium">
                    {submitModalCDE.organizationName}
                  </span>
                </p>

                {/* Deal summary */}
                <div className="bg-gray-800/50 rounded-lg p-3 mb-4 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Location</span>
                    <span className="text-gray-300">
                      {selectedMatchDeal!.city}, {selectedMatchDeal!.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Allocation</span>
                    <span className="text-emerald-400 font-medium">
                      {formatCurrency(selectedMatchDeal!.allocation)}
                    </span>
                  </div>
                  {submitModalCDE.matchScore !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Match Score</span>
                      <span
                        className={`font-medium ${submitModalCDE.matchScore >= 80 ? "text-green-400" : submitModalCDE.matchScore >= 60 ? "text-amber-400" : "text-gray-400"}`}
                      >
                        {submitModalCDE.matchScore}%
                      </span>
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="text-xs text-red-400 mb-3 bg-red-900/20 border border-red-800/30 rounded px-3 py-2">
                    {submitError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitModalCDE(null);
                      setMapPreviewStep(false);
                      setMapSubmitSuccess(false);
                      setMapDealPickStep(false);
                      setSubmitError(null);
                    }}
                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handlePreviewSubmit}
                    disabled={mapPreviewLoading}
                    className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {mapPreviewLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Preview Email
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
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : mapSubmitSuccess ? (
              /* Success state */
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-900/30 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-400"
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
                <h3 className="text-xl font-bold text-white mb-2">
                  Allocation Request Sent!
                </h3>
                <p className="text-gray-400 mb-1">
                  Email delivered to{" "}
                  <span className="text-white font-medium">
                    {submitModalCDE.organizationName}
                  </span>
                </p>
                {mapPreviewContactEmail && (
                  <p className="text-sm text-gray-500">
                    Sent to: {mapPreviewContactEmail}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-4">
                  Includes your Deal Card and Project Profile attachment.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitModalCDE(null);
                    setMapPreviewStep(false);
                    setMapSubmitSuccess(false);
                    setMapDealPickStep(false);
                    setMapPreviewHtml("");
                  }}
                  className="mt-6 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              /* Step 2: Email Preview */
              <>
                <div className="p-5 border-b border-gray-800">
                  <h3 className="text-lg font-bold text-white">
                    Preview Email to {submitModalCDE.organizationName}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Review before sending
                  </p>
                </div>

                <div
                  className="overflow-y-auto p-4"
                  style={{ maxHeight: "calc(90vh - 160px)" }}
                >
                  {mapPreviewLoading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-gray-400 text-sm">
                        Generating email preview...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Email meta */}
                      <div className="mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700 space-y-1">
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 w-12 shrink-0">
                            To:
                          </span>
                          <span className="text-gray-300">
                            {mapPreviewContactEmail || "CDE Contact"}
                          </span>
                        </div>
                        <div className="flex gap-2 text-sm">
                          <span className="text-gray-500 w-12 shrink-0">
                            Subject:
                          </span>
                          <span className="text-white font-medium">
                            {mapPreviewSubject}
                          </span>
                        </div>
                      </div>

                      {/* Iframe preview */}
                      <div className="border border-gray-700 rounded-lg overflow-hidden bg-white">
                        <iframe
                          ref={mapIframeRef}
                          title="Email Preview"
                          className="w-full"
                          style={{ height: "500px", border: "none" }}
                          sandbox="allow-same-origin"
                        />
                      </div>
                    </>
                  )}

                  {submitError && (
                    <p className="mt-3 text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded px-3 py-2">
                      {submitError}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-800 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMapPreviewStep(false);
                      setMapPreviewHtml("");
                      setSubmitError(null);
                    }}
                    className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors flex items-center gap-1"
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
                    Back
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSubmitModalCDE(null);
                        setMapPreviewStep(false);
                        setMapDealPickStep(false);
                        setMapPreviewHtml("");
                        setSubmitError(null);
                      }}
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    {mapPreviewHtml && (
                      <button
                        type="button"
                        onClick={handleConfirmSubmit}
                        disabled={submitLoading}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg text-sm transition-colors flex items-center gap-2"
                      >
                        {submitLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Sending...
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
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                            Send Allocation Request
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
