"use client";

import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { Building2, Briefcase, TrendingUp } from "lucide-react";

const orgTypeIcons = {
  sponsor: Building2,
  cde: Briefcase,
  investor: TrendingUp,
} as const;

interface OrgData {
  id: string;
  name: string;
  slug: string;
  type: "sponsor" | "cde" | "investor";
}

export function OrganizationBadge() {
  const { user, isLoading: _isLoading } = useCurrentUser();
  const [org, setOrg] = useState<OrgData | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchOrg = async () => {
      try {
        const supabase = createClient();
        // Read org data directly from users table (no organizations table)
        const { data } = await supabase
          .from("users")
          .select("organization_id, organization_name, role_type")
          .eq("id", user.id)
          .single();

        if (data?.organization_id) {
          setOrg({
            id: data.organization_id,
            name: data.organization_name || "Organization",
            slug: data.organization_id,
            type:
              (data.role_type as "sponsor" | "cde" | "investor") || "sponsor",
          });
        }
      } catch (_err) {
        // Silently fail - org badge is optional UI
      }
    };

    fetchOrg();
  }, [user?.id]);

  if (!org) return null;

  const Icon = orgTypeIcons[org.type] || Building2;

  return (
    <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 rounded-lg border border-gray-700">
      <Icon className="h-3.5 w-3.5 text-indigo-400" />
      <span className="text-xs text-gray-300 max-w-[120px] truncate">
        {org.name}
      </span>
    </div>
  );
}
