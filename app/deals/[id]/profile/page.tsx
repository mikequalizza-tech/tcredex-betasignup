"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { fetchDealById } from "@/lib/supabase/queries";
import { Deal } from "@/lib/data/deals";
import { generateProfileData } from "@/components/deals/ProjectProfileHTML";

// Dynamic import for PDF generation component (heavy library)
const ProjectProfileHTML = dynamic(
  () => import("@/components/deals/ProjectProfileHTML"),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
    ssr: false,
  },
);

export default function ProjectProfilePage() {
  const params = useParams();
  const dealId = (params?.id ?? "") as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDeal() {
      setLoading(true);
      try {
        const fetchedDeal = await fetchDealById(dealId);
        setDeal(fetchedDeal || null);
      } catch (error) {
        console.error("Failed to load deal:", error);
      } finally {
        setLoading(false);
      }
    }
    loadDeal();
  }, [dealId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Project Not Found
          </h1>
          <Link href="/deals" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!deal) return;
    setDownloading(true);
    try {
      // Server-side PDF via Puppeteer (real Chrome engine, pixel-perfect)
      const res = await fetch(`/api/deals/${dealId}/pdf`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `PDF generation failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deal.projectName?.replace(/[^a-zA-Z0-9]/g, "_") || "project"}_profile.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF. Please try printing instead.");
    } finally {
      setDownloading(false);
    }
  };

  // Get intake data for additional fields
  const intakeData = deal.intake_data || deal.draftData || {};

  // Build profile data object for ProjectProfileHTML
  const profileData = generateProfileData(
    deal as unknown as Record<string, unknown>,
    intakeData,
  );

  // Override with direct deal properties where available
  if (deal.projectCost) profileData.totalProjectCost = deal.projectCost;
  if (deal.allocation) profileData.nmtcRequest = deal.allocation;
  if (deal.financingGap) profileData.financingGap = deal.financingGap;
  if (deal.povertyRate) profileData.povertyRate = deal.povertyRate;
  if (deal.medianIncome) profileData.medianIncome = deal.medianIncome;
  if (deal.unemployment) profileData.unemploymentRate = deal.unemployment;
  if (deal.sources && deal.sources.length > 0)
    profileData.sources = deal.sources;
  if (deal.uses && deal.uses.length > 0) profileData.uses = deal.uses;
  if (deal.description) profileData.projectDescription = deal.description;
  if (deal.communityImpact) profileData.communityImpact = deal.communityImpact;

  // Get featured image from various sources
  if (!profileData.featuredImageUrl) {
    if (intakeData.projectImages && intakeData.projectImages.length > 0) {
      const firstImage = intakeData.projectImages[0];
      profileData.featuredImageUrl =
        typeof firstImage === "string" ? firstImage : firstImage?.url;
    } else if (deal.heroImageUrl) {
      profileData.featuredImageUrl = deal.heroImageUrl;
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Actions - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/deals"
              className="text-gray-400 hover:text-white flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
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
              Marketplace
            </Link>
            {/* View Format Navigation */}
            <div className="flex gap-1 ml-4 border-l border-gray-700 pl-4">
              <Link
                href={`/deals/${dealId}/card`}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Deal Card
              </Link>
              <span className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg">
                1-Page Profile
              </span>
              <Link
                href={`/deals/${dealId}`}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                Full Profile
              </Link>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-wait flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
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
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
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
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print
            </button>
          </div>
        </div>
      </div>

      {/* Project Profile - Centered with proper sizing */}
      <div className="flex justify-center items-start py-8 px-4 print:p-0">
        <div ref={profileRef} id="project-profile-html">
          <ProjectProfileHTML data={profileData} />
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          #project-profile-html {
            margin: 0 auto;
          }
          @page {
            size: letter;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
