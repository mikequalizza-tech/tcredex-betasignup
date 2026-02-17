"use client";

import {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { User, Role, hasMinimumRole, Organization } from "./types";

export interface ExtendedAuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  needsRegistration: boolean;
  canViewDocument: (ownerId: string) => boolean;
  canEditDocument: (ownerId: string) => boolean;
  canDeleteDocument: (ownerId: string) => boolean;
  canShareDocument: (ownerId: string) => boolean;
  canUploadDocument: (projectId?: string) => boolean;
  canManageTeam: () => boolean;
  canManageSettings: () => boolean;
  canEditOrganization: () => boolean;
  hasProjectAccess: (
    projectId: string,
    requiredRole?: "admin" | "member" | "viewer",
  ) => boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  switchRole: (role: "sponsor" | "cde" | "investor" | "admin") => void;
  currentDemoRole: "sponsor" | "cde" | "investor" | "admin" | null;
  orgType: "cde" | "sponsor" | "investor" | "admin" | undefined;
  orgName: string;
  orgLogo?: string;
  organizationId: string | undefined;
  userId: string | undefined;
  userName: string;
  userEmail: string;
  userRole: Role;
  isOrgAdmin: boolean;
}

// ============================================================================
// Shared React Context — AuthProvider fetches ONCE, all descendants share it
// ============================================================================
const AuthStateContext = createContext<ExtendedAuthContext | null>(null);

/**
 * Internal hook that performs the actual auth fetch.
 * When `skip` is true (inside AuthProvider), no network calls are made.
 */
function useAuthState(skip: boolean): ExtendedAuthContext {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(!skip);
  const [needsRegistration, setNeedsRegistration] = useState(false);

  useEffect(() => {
    if (skip) return;

    let cancelled = false;
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (cancelled) return;

        if (!authUser) {
          setUser(null);
          setOrganization(null);
          setIsLoading(false);
          return;
        }

        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            "id, email, name, role, organization_id, role_type, organization_name, avatar_url, title, phone",
          )
          .eq("id", authUser.id)
          .single();

        if (cancelled) return;

        if (userError || !userData) {
          // Auth exists but no users row — needs registration
          setUser(null);
          setOrganization(null);
          setNeedsRegistration(true);
          setIsLoading(false);
          return;
        }

        const organizationData = userData.organization_id
          ? ({
              id: userData.organization_id,
              name: userData.organization_name || "Organization",
              slug: userData.organization_id,
              type: (userData.role_type as Organization["type"]) || "sponsor",
            } as Organization)
          : null;

        setOrganization(organizationData);
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          avatar: userData.avatar_url || undefined,
          role: (userData.role as Role) ?? Role.VIEWER,
          organizationId: userData.organization_id ?? "",
          organization: organizationData || ({} as Organization),
          projectAssignments: [],
          createdAt: "",
        });
        setIsLoading(false);
      } catch (_err) {
        if (cancelled) return;
        setUser(null);
        setOrganization(null);
        setIsLoading(false);
      }
    };

    fetchUser();
    return () => {
      cancelled = true;
    };
  }, [skip]);

  const canViewDocument = useCallback(
    (ownerId: string) => !!user && user.id === ownerId,
    [user],
  );
  const canEditDocument = useCallback(
    (ownerId: string) => !!user && user.id === ownerId,
    [user],
  );
  const canDeleteDocument = useCallback(
    (ownerId: string) => !!user && user.id === ownerId,
    [user],
  );
  const canShareDocument = useCallback(
    (ownerId: string) => !!user && user.id === ownerId,
    [user],
  );
  const canUploadDocument = useCallback(() => !!user, [user]);
  const canManageTeam = useCallback(
    () => !!user && user.role === Role.ORG_ADMIN,
    [user],
  );
  const canManageSettings = useCallback(
    () => !!user && hasMinimumRole(user.role, Role.PROJECT_ADMIN),
    [user],
  );
  const canEditOrganization = useCallback(
    () => !!user && user.role === Role.ORG_ADMIN,
    [user],
  );
  const hasProjectAccess = useCallback(() => true, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err) {
      console.error("[Auth] login error", err);
      return { success: false, error: "Login failed" };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      if (typeof window !== "undefined") {
        window.location.href = "/";
      }
    } catch (err) {
      console.error("[Auth] logout error", err);
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    // Trigger re-fetch by toggling skip (no-op when standalone)
  }, []);

  const switchRole = useCallback(
    (_role: "sponsor" | "cde" | "investor" | "admin") => {
      console.warn(
        "[Auth] switchRole is disabled; use database for role management.",
      );
    },
    [],
  );

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    needsRegistration,
    canViewDocument,
    canEditDocument,
    canDeleteDocument,
    canShareDocument,
    canUploadDocument,
    canManageTeam,
    canManageSettings,
    canEditOrganization,
    hasProjectAccess,
    login,
    logout,
    refresh,
    switchRole,
    currentDemoRole: null,
    orgType: organization?.type || undefined,
    orgName: organization?.name || "",
    orgLogo: organization?.logo,
    organizationId: organization?.id,
    userId: user?.id,
    userName: user?.name || "",
    userEmail: user?.email || "",
    userRole: user?.role || Role.VIEWER,
    isOrgAdmin: !!user && user.role === Role.ORG_ADMIN,
  };
}

// ============================================================================
// AuthProvider — wrap authenticated route trees with this
// Fetches auth data ONCE, shares with all useCurrentUser() descendants
// ============================================================================
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthState(false);
  return (
    <AuthStateContext.Provider value={auth}>
      {children}
    </AuthStateContext.Provider>
  );
}

// ============================================================================
// useCurrentUser — the public hook
// Inside AuthProvider: reads shared context (zero network calls)
// Outside AuthProvider: fetches standalone (backward compatible)
// ============================================================================
export function useCurrentUser(): ExtendedAuthContext {
  const ctx = useContext(AuthStateContext);
  // Always call useAuthState (React hook rules), but skip fetch when context exists
  const standalone = useAuthState(ctx !== null);
  return ctx || standalone;
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: Role,
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useCurrentUser();

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (!isAuthenticated) {
      if (typeof window !== "undefined") {
        window.location.href = "/signin";
      }
      return null;
    }

    if (requiredRole && user && !hasMinimumRole(user.role, requiredRole)) {
      return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-100 mb-2">
              Access Denied
            </h1>
            <p className="text-gray-400">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
