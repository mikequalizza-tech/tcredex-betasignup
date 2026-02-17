import { useMemo } from "react";
import { Deal } from "@/lib/data/deals";
import { CDEDealCard, InvestorCard } from "@/lib/types/marketplace";

export interface FilterState {
  creditTypes: string[];
  includeStateCredits: boolean;
  shovelReadyOnly: boolean;
  seekingAllocation: boolean;
  inClosing: boolean;
  severelyDistressedOnly: boolean;
  qctOnly: boolean;
  areaType: "all" | "rural" | "urban";
  projectTypes: string[];
  allocationRequest: { min?: number; max?: number };
}

// MatchCriteria is imported from @/lib/types/marketplace

export function useDealsFiltering(
  deals: Deal[],
  searchQuery: string,
  filters: FilterState,
  levelFilter: string,
  statusFilter: string,
  stateFilter: string,
  activeMatchCriteria: string[],
) {
  const filteredDeals = useMemo(() => {
    let result = deals.filter((d) => d.visible !== false);

    // Text search - optimized with early returns
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

    // Credit type filter
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
    } else if (levelFilter !== "all") {
      result = result.filter((d) => d.programLevel === levelFilter);
    }

    // Deal status filters
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

    // State and status filters
    if (stateFilter !== "all")
      result = result.filter((d) => d.state === stateFilter);
    if (statusFilter !== "all")
      result = result.filter((d) => d.status === statusFilter);

    // Match Criteria filters
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
              if (!d.allocation || d.allocation <= 0) return false;
              break;
          }
        }
        return true;
      });
    }

    return result;
  }, [
    deals,
    searchQuery,
    filters,
    levelFilter,
    statusFilter,
    stateFilter,
    activeMatchCriteria,
  ]);

  return filteredDeals;
}

export function useCDEsFiltering(
  cdes: CDEDealCard[],
  searchQuery: string,
  stateFilter: string,
  autoMatchEnabled: boolean,
  autoMatchResults: Map<string, { score: number; reasons: string[] }>,
  activeMatchCriteria: string[],
) {
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

    // Match Criteria filters for CDEs
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

    // Sort by AutoMatch score when enabled
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

  return filteredCDEs;
}

export function useInvestorsFiltering(
  investors: InvestorCard[],
  searchQuery: string,
) {
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

  return filteredInvestors;
}
