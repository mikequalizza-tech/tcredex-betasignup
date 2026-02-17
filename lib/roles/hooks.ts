/**
 * Role Configuration Hooks
 * ========================
 * React hooks for accessing role-based configuration in components.
 */

"use client";

import { useMemo } from "react";
import { useCurrentUser } from "@/lib/auth";
import {
  OrgType,
  getMarketplaceConfig,
  getPipelineStages,
  getMapConfig,
  getNavItemsForRole,
  getDealVisibility,
  canAccessPage,
  MarketplaceConfig,
  PipelineStage,
  MapConfig,
  NavItem,
  VisibilityTier,
  DealCardVisibility,
} from "./config";

export interface RoleConfig {
  orgType: OrgType | undefined;
  orgId: string | undefined;
  isAuthenticated: boolean;
  isLoading: boolean;
  marketplace: MarketplaceConfig;
  pipelineStages: PipelineStage[];
  mapConfig: MapConfig;
  navItems: NavItem[];
  canAccess: (pageId: string) => boolean;
  getDealVisibility: (tier: VisibilityTier) => DealCardVisibility;
}

/**
 * Main hook for accessing role-based configuration
 * Use this in components that need to adapt their behavior based on user role
 */
export function useRoleConfig(): RoleConfig {
  const { orgType, organizationId, isAuthenticated, isLoading } =
    useCurrentUser();

  const config = useMemo<RoleConfig>(
    () => ({
      orgType: orgType as OrgType | undefined,
      orgId: organizationId,
      isAuthenticated,
      isLoading,
      marketplace: getMarketplaceConfig(orgType as OrgType | undefined),
      pipelineStages: getPipelineStages(orgType as OrgType | undefined),
      mapConfig: getMapConfig(orgType as OrgType | undefined),
      navItems: getNavItemsForRole(orgType as OrgType | undefined),
      canAccess: (pageId: string) =>
        canAccessPage(orgType as OrgType | undefined, pageId),
      getDealVisibility,
    }),
    [orgType, organizationId, isAuthenticated, isLoading],
  );

  return config;
}

/**
 * Hook specifically for marketplace configuration
 */
export function useMarketplaceConfig(): MarketplaceConfig & {
  orgType: OrgType | undefined;
  orgId: string | undefined;
} {
  const { orgType, organizationId } = useCurrentUser();

  return useMemo(
    () => ({
      ...getMarketplaceConfig(orgType as OrgType | undefined),
      orgType: orgType as OrgType | undefined,
      orgId: organizationId,
    }),
    [orgType, organizationId],
  );
}

/**
 * Hook specifically for pipeline stages
 */
export function usePipelineStages(): {
  stages: PipelineStage[];
  orgType: OrgType | undefined;
} {
  const { orgType } = useCurrentUser();

  return useMemo(
    () => ({
      stages: getPipelineStages(orgType as OrgType | undefined),
      orgType: orgType as OrgType | undefined,
    }),
    [orgType],
  );
}

/**
 * Hook specifically for map configuration
 */
export function useMapConfig(): MapConfig & { orgType: OrgType | undefined } {
  const { orgType } = useCurrentUser();

  return useMemo(
    () => ({
      ...getMapConfig(orgType as OrgType | undefined),
      orgType: orgType as OrgType | undefined,
    }),
    [orgType],
  );
}

/**
 * Hook to check if user can access a specific page
 */
export function usePageAccess(pageId: string): boolean {
  const { orgType } = useCurrentUser();
  return canAccessPage(orgType as OrgType | undefined, pageId);
}
