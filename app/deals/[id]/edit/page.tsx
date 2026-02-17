"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/lib/auth";
import { IntakeShell, IntakeData } from "@/components/intake-v4";
import Link from "next/link";

// Sponsor organization data for display in intake form
interface SponsorOrgData {
  organization_name?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  primary_contact_phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  year_founded?: number;
  description?: string;
  organization_type?: string;
  low_income_owned?: boolean;
  woman_owned?: boolean;
  minority_owned?: boolean;
  veteran_owned?: boolean;
}

export default function EditDealPage() {
  const router = useRouter();
  const params = useParams();
  const dealId = params.id as string;

  const {
    orgType,
    isLoading: authLoading,
    isAuthenticated,
    organizationId,
    orgName,
    userName,
    userEmail,
    user,
  } = useCurrentUser();

  const [dealData, setDealData] = useState<Partial<IntakeData> | null>(null);
  const [isLoadingDeal, setIsLoadingDeal] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sponsor organization data for display
  const [sponsorData, setSponsorData] = useState<SponsorOrgData | null>(null);

  // Fetch sponsor organization data
  useEffect(() => {
    async function fetchSponsorData() {
      if (!organizationId || orgType !== "sponsor") return;

      try {
        const response = await fetch(`/api/organization?id=${organizationId}`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setSponsorData(data.organization || null);
        }
      } catch (error) {
        console.error("Failed to fetch sponsor data:", error);
      }
    }

    fetchSponsorData();
  }, [organizationId, orgType]);

  // Fetch existing deal data
  useEffect(() => {
    async function fetchDeal() {
      if (!dealId) return;

      try {
        const response = await fetch(`/api/deals/${dealId}`);
        if (!response.ok) {
          throw new Error("Failed to load deal");
        }
        const data = await response.json();

        // Map deal record back to IntakeData format
        // Priority: intake_data > direct columns
        const intakeFromDb = data.intake_data || {};
        const intakeData: Partial<IntakeData> = {
          ...intakeFromDb, // Start with stored intake_data
          projectName:
            intakeFromDb.projectName || data.project_name || data.name,
          address: intakeFromDb.address || data.address,
          city: intakeFromDb.city || data.city,
          state: intakeFromDb.state || data.state,
          zipCode: intakeFromDb.zipCode || data.zip_code,
          county: intakeFromDb.county || data.county,
          censusTract: intakeFromDb.censusTract || data.census_tract,
          latitude: intakeFromDb.latitude || data.latitude,
          longitude: intakeFromDb.longitude || data.longitude,
          projectType: intakeFromDb.projectType || data.project_type,
          totalProjectCost:
            intakeFromDb.totalProjectCost || data.total_project_cost,
          programs: intakeFromDb.programs || data.programs || [],
          projectDescription:
            intakeFromDb.projectDescription || data.project_description,
          sponsorName:
            intakeFromDb.sponsorName ||
            data.sponsor?.organization_name ||
            data.sponsor_organization_name ||
            data.sponsor_name,
        };

        setDealData(intakeData);
      } catch (err) {
        console.error("Error fetching deal:", err);
        setError(err instanceof Error ? err.message : "Failed to load deal");
      } finally {
        setIsLoadingDeal(false);
      }
    }

    fetchDeal();
  }, [dealId]);

  // Loading state
  if (authLoading || isLoadingDeal) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading deal...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Error Loading Deal
          </h1>
          <p className="text-gray-400 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">
            Sign In Required
          </h1>
          <p className="text-gray-400 mb-6">
            You need to sign in to edit a deal.
          </p>
          <Link
            href="/signin"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (orgType !== "sponsor") {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Sponsor Access Only
          </h1>
          <p className="text-gray-400 mb-6">
            Only Project Sponsors can edit deals.
          </p>
          <Link
            href="/deals"
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async (
    data: IntakeData,
    _readinessScore: number,
    _tier: number,
  ) => {
    const sponsorId = organizationId || user?.id;
    if (!sponsorId) {
      alert("Unable to save: No organization ID available.");
      return;
    }

    try {
      const enrichedData = {
        ...data,
        sponsorId,
        sponsorOrganizationId: sponsorId,
        sponsorName: data.sponsorName || orgName || userName,
        personCompletingForm: userEmail || userName,
      };

      const response = await fetch("/api/intake", {
        method: "POST", // POST handles both create and update via dealId
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          intakeData: enrichedData,
          saveOnly: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save changes");
      }

      console.log("Changes saved");
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  const handleSubmit = async (
    data: IntakeData,
    _readinessScore: number,
    _tier: number,
  ) => {
    const sponsorId = organizationId || user?.id;
    if (!sponsorId) {
      alert("Unable to submit: No organization ID available.");
      return;
    }

    try {
      const enrichedData = {
        ...data,
        sponsorId,
        sponsorOrganizationId: sponsorId,
        sponsorName: data.sponsorName || orgName || userName,
        personCompletingForm: userEmail || userName,
      };

      const response = await fetch("/api/intake", {
        method: "POST", // POST handles both create and update via dealId
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId,
          intakeData: enrichedData,
          saveOnly: false,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update deal");
      }

      router.push(`/deals/${dealId}`);
    } catch (error) {
      console.error("Submit failed:", error);
      alert("Failed to update deal. Please try again.");
    }
  };

  return (
    <IntakeShell
      initialData={dealData || undefined}
      projectId={dealId}
      isEditMode={true}
      onSave={handleSave}
      onSubmit={handleSubmit}
      organizationName={orgName}
      organizationType={orgType}
      sponsorData={sponsorData}
    />
  );
}
