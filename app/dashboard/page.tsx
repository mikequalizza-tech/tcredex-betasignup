'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/auth';
import {
  SponsorDashboardV2,
  CDEDashboardV2,
  InvestorDashboardV2
} from '@/components/dashboard';
import WelcomeModal from '@/components/WelcomeModal';

/**
 * Dashboard Page
 *
 * Auth is handled by dashboard/layout.tsx (AuthProvider + ProtectedContent).
 * This page reads role from shared context (zero network calls) and renders
 * the correct role-specific dashboard. No ProtectedRoute wrapper needed.
 */
export default function DashboardPage() {
  const { orgType, userName, orgName, organizationId, currentDemoRole } = useCurrentUser();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    // Clean up any old localStorage auth data
    try {
      localStorage.removeItem('tcredex_session');
      localStorage.removeItem('tcredex_demo_role');
      localStorage.removeItem('tcredex_registered_user');
    } catch {
      // Ignore cleanup errors
    }
  }, []);

  const handleDismissWelcome = () => {
    setShowWelcome(false);
  };

  // Determine which dashboard to show based on role
  const isAdmin = currentDemoRole === 'admin';

  // Admin sees CDE dashboard as default
  if (isAdmin) {
    return (
      <div className="p-6 bg-gray-950 min-h-screen">
        {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
        <CDEDashboardV2 userName={userName} orgName={orgName || 'Admin'} organizationId={organizationId} />
      </div>
    );
  }

  // Role-based dashboard selection using enhanced V2 dashboards
  switch (orgType) {
    case 'sponsor':
      // Sponsors see the "Project Cockpit" - track deals with 3-request limit and DD vault
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <SponsorDashboardV2 userName={userName} orgName={orgName || 'Demo Organization'} organizationId={organizationId} />
        </div>
      );
    case 'cde':
      // CDEs see the "Deployment Tracker" - manage allocation with mandate settings
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <CDEDashboardV2 userName={userName} orgName={orgName || 'Demo CDE'} organizationId={organizationId} />
        </div>
      );
    case 'investor':
      // Investors see the "Investment Portal" - risk filters and CRA tracking
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <InvestorDashboardV2 userName={userName} orgName={orgName || 'Demo Investor'} organizationId={organizationId} />
        </div>
      );
    default:
      // Default to Sponsor view
      return (
        <div className="p-6 bg-gray-950 min-h-screen">
          {showWelcome && <WelcomeModal onDismiss={handleDismissWelcome} />}
          <SponsorDashboardV2 userName={userName} orgName={orgName || 'Demo Organization'} organizationId={organizationId} />
        </div>
      );
  }
}
