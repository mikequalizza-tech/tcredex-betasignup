"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export interface CurrentUserData {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
  organization: {
    id: string;
    name: string;
    slug: string;
    type: "sponsor" | "cde" | "investor";
  } | null;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const supabase = createClient();
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select(
            `
            id,
            email,
            name,
            role,
            role_type,
            organization_id,
            organization_name
          `,
          )
          .eq("id", authUser.id)
          .single();
        if (userError || !userData) {
          setUser(null);
          setError(userError);
          setIsLoading(false);
          return;
        }
        // Organization data comes directly from users table (no separate organizations table)
        setUser({
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role ?? "",
          organization_id: userData.organization_id ?? "",
          organization: userData.organization_id
            ? {
                id: userData.organization_id,
                name: userData.organization_name || "Organization",
                slug: userData.organization_id,
                type:
                  (userData.role_type as "sponsor" | "cde" | "investor") ||
                  "sponsor",
              }
            : null,
        });
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setUser(null);
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
  };
}
