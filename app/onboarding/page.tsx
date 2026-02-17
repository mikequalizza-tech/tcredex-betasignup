"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Building2, Briefcase, TrendingUp, ArrowRight, Check } from "lucide-react";

// Role types
type OrgType = "sponsor" | "cde" | "investor";

const orgTypes: { id: OrgType; title: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "sponsor",
    title: "Project Sponsor",
    description: "Projects seeking tax credit financing",
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    id: "cde",
    title: "CDE / Allocatee",
    description: "NMTC allocation to deploy",
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    id: "investor",
    title: "Investor",
    description: "Invest in tax credit opportunities",
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<OrgType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push("/signin");
        return;
      }
      // Check if already onboarded (role-driven only)
      const { data: userProfile } = await supabase
        .from("users")
        .select("role_type")
        .eq("id", authUser.id)
        .single();
      if (userProfile?.role_type) {
        router.push("/dashboard");
        return;
      }
      setUser({ id: authUser.id, email: authUser.email || "" });
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleSelectRole = async (roleType: OrgType) => {
    if (!user) return;
    setSelectedType(roleType);
    setIsSubmitting(true);
    setError("");
    const supabase = createClient();
    const roleTable = roleType === "sponsor" ? "sponsors"
      : roleType === "cde" ? "cdes"
      : "investors";
    const userName = user.email.split("@")[0];
    // Use user.id as organization_id everywhere
    const { data: roleRecord, error: roleError } = await supabase
      .from(roleTable)
      .insert({
        primary_contact_name: userName,
        primary_contact_email: user.email,
        organization_id: user.id,
      })
      .select("id")
      .single();
    if (roleError) {
      setError("Failed to create role record");
      setIsSubmitting(false);
      return;
    }
    // Check if user profile exists
    const { data: existingProfile } = await supabase
      .from("users")
      .select("id")
      .eq("id", user.id)
      .single();
    if (existingProfile) {
      // Update existing (set organization_id)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          role_type: roleType,
          role: "ORG_ADMIN",
          organization_id: user.id,
        })
        .eq("id", user.id);
      if (updateError) {
        await supabase.from(roleTable).delete().eq("id", roleRecord.id);
        setError("Failed to update user profile");
        setIsSubmitting(false);
        return;
      }
    } else {
      // Create new (set organization_id)
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: user.id,
          email: user.email,
          name: userName,
          role_type: roleType,
          role: "ORG_ADMIN",
          organization_id: user.id,
        });
      if (insertError) {
        await supabase.from(roleTable).delete().eq("id", roleRecord.id);
        setError("Failed to create user profile");
        setIsSubmitting(false);
        return;
      }
    }
    setComplete(true);
    setTimeout(() => {
      if (roleType === "sponsor") {
        router.push("/dashboard");
      } else if (roleType === "cde") {
        router.push("/dashboard/pipeline");
      } else {
        router.push("/deals");
      }
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (complete) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-xl p-6">
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-green-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="h-6 w-6 text-green-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">You're all set!</h2>
            <p className="text-gray-400 text-sm">Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">
            Welcome to tCredex!
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Select your role to get started
          </p>
        </div>
        {/* Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-2.5 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-xs">
              {error}
            </div>
          )}
          <div className="space-y-2">
            {orgTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => handleSelectRole(type.id)}
                disabled={isSubmitting}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-700 hover:border-indigo-500 hover:bg-indigo-500/10 transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  {type.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-white">{type.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{type.description}</p>
                </div>
                {isSubmitting && selectedType === type.id ? (
                  <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </div>
        {/* Footer */}
        <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-800">
          <p className="text-xs text-center text-gray-500">
            Secured by tCredex
          </p>
        </div>
      </div>
    </div>
  );
}
