'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/auth';
import { IntakeShell, IntakeData } from '@/components/intake-v4';
import Link from 'next/link';

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

export default function NewDealPage() {
  const router = useRouter();
  const { orgType, isLoading, isAuthenticated, organizationId, orgName, userName, userEmail, user } = useCurrentUser();

  // Track the deal ID after first save so subsequent saves update instead of creating duplicates
  const [savedDealId, setSavedDealId] = useState<string | null>(null);

  // Sponsor organization data for display
  const [sponsorData, setSponsorData] = useState<SponsorOrgData | null>(null);

  // Fetch sponsor organization data
  useEffect(() => {
    async function fetchSponsorData() {
      if (!organizationId || orgType !== 'sponsor') return;

      try {
        const response = await fetch(`/api/organization?id=${organizationId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSponsorData(data.organization || null);
        }
      } catch (error) {
        console.error('Failed to fetch sponsor data:', error);
      }
    }

    fetchSponsorData();
  }, [organizationId, orgType]);

  // Role-based access control - only sponsors can submit deals
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-2xl font-bold text-gray-100 mb-4">Sign In Required</h1>
          <p className="text-gray-400 mb-6">You need to sign in to submit a deal.</p>
          <Link href="/signin" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (orgType !== 'sponsor') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md p-8 bg-gray-900 rounded-xl border border-gray-800">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Sponsor Access Only</h1>
          <p className="text-gray-400 mb-6">
            Only Project Sponsors can submit deals to the marketplace. 
            {orgType === 'cde' && ' As a CDE, you can review and match with submitted deals in your Pipeline.'}
            {orgType === 'investor' && ' As an Investor, you can browse and invest in deals from the Marketplace.'}
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              href="/deals" 
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
            >
              Browse Marketplace
            </Link>
            <Link 
              href="/dashboard" 
              className="px-6 py-3 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async (data: IntakeData, readinessScore: number, tier: number) => {
    console.log('Saving draft...', { data, readinessScore, tier, organizationId, userId: user?.id });

    // Use organizationId, fallback to user.id for demo accounts without org
    const sponsorId = organizationId || user?.id;

    if (!sponsorId) {
      const error = new Error('No organization ID available. Please try logging out and back in.');
      console.error('No sponsorId available - user may not be properly authenticated');
      throw error; // Re-throw so IntakeShell knows save failed
    }

    // Enrich data with user/org info
    // sponsor_id = organization ID so all team members see the same deals
    const enrichedData = {
      ...data,
      sponsorId: sponsorId,  // Organization ID (or user ID fallback) - shared by all team members
      sponsorOrganizationId: sponsorId,
      sponsorName: data.sponsorName || orgName || userName,
      personCompletingForm: userEmail || userName,
    };

    // Use /api/intake which properly maps IntakeData to deal record
    // Include dealId if we already saved this deal (to update instead of creating duplicate)
    const response = await fetch('/api/intake', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealId: savedDealId,  // Pass dealId for updates
        intakeData: enrichedData,
        saveOnly: true  // Save as draft without submitting
      })
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save draft';
      try {
        const error = await response.json();
        errorMessage = error.message || error.error || errorMessage;
      } catch {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      console.error('Save failed:', { status: response.status, error: errorMessage });
      throw new Error(errorMessage); // Re-throw so IntakeShell knows save failed
    }

    const result = await response.json();
    console.log('Draft saved successfully:', result);

    // Store the dealId so subsequent saves update the same deal
    if (result.dealId && !savedDealId) {
      setSavedDealId(result.dealId);
    }
    // Success - IntakeShell will handle resetting hasChanges state
  };

  const handleSubmit = async (data: IntakeData, readinessScore: number, tier: number) => {
    console.log('Submitting to marketplace...', { data, readinessScore, tier, organizationId, userId: user?.id });

    // Use organizationId, fallback to user.id for demo accounts without org
    const sponsorId = organizationId || user?.id;

    if (!sponsorId) {
      console.error('No sponsorId available - user may not be properly authenticated');
      alert('Unable to submit: No organization ID available. Please try logging out and back in.');
      return;
    }

    try {
      // Enrich data with user/org info
      // sponsor_id = organization ID so all team members see the same deals
      const enrichedData = {
        ...data,
        sponsorId: sponsorId,  // Organization ID (or user ID fallback) - shared by all team members
        sponsorOrganizationId: sponsorId,
        sponsorName: data.sponsorName || orgName || userName,
        personCompletingForm: userEmail || userName,
      };

      // Use /api/intake which properly maps IntakeData to deal record
      // Include dealId if we already saved this deal (to update instead of creating duplicate)
      const response = await fetch('/api/intake', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dealId: savedDealId,  // Pass dealId for updates
          intakeData: enrichedData,
          saveOnly: false  // Submit to marketplace
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Failed to submit deal');
      }

      const result = await response.json();
      console.log('Deal submitted:', result);

      // Redirect to the new deal's page or marketplace
      if (result.dealId) {
        router.push(`/deals/${result.dealId}`);
      } else {
        router.push('/deals');
      }
    } catch (error) {
      console.error('Submit failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit deal. Please try again.';
      alert(errorMessage);
    }
  };

  return (
    <IntakeShell
      onSave={handleSave}
      onSubmit={handleSubmit}
      organizationName={orgName}
      organizationType={orgType}
      sponsorData={sponsorData}
    />
  );
}
