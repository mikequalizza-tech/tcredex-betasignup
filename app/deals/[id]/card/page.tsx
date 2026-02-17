"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { fetchDealById } from "@/lib/supabase/queries";
import { Deal } from "@/lib/data/deals";
import DealCardHTML from "@/components/deals/DealCardHTML";

export default function DealCardPage() {
  const params = useParams();
  const dealId = (params?.id ?? "") as string;
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

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
          <h1 className="text-2xl font-bold text-white mb-4">Deal Not Found</h1>
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
    if (!deal || !cardRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const element = document.getElementById("deal-card-html");
      if (!element) throw new Error("Deal card element not found");

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.98);
      // Deal card is 4" x 5.5"
      const pdf = new jsPDF({
        unit: "in",
        format: [4, 5.5],
        orientation: "portrait",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const fitWidth = (pageHeight * canvas.width) / canvas.height;
        const xOffset = (pageWidth - fitWidth) / 2;
        pdf.addImage(imgData, "JPEG", xOffset, 0, fitWidth, pageHeight);
      } else {
        pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight);
      }

      const filename = `${deal.projectName?.replace(/[^a-zA-Z0-9]/g, "_") || "deal"}_card.pdf`;
      pdf.save(filename);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to generate PDF. Please try printing instead.");
    } finally {
      setDownloading(false);
    }
  };

  // Get intake data for additional fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const intakeData: any = deal.intake_data || deal.draftData || {};

  // Build deal data object for DealCardHTML
  const dealCardData = {
    id: deal.id,
    projectName: deal.projectName,
    sponsorName: deal.sponsorName,
    city: deal.city,
    state: deal.state,
    address: deal.address || intakeData.address,
    censusTract: deal.censusTract || intakeData.censusTract,
    povertyRate: deal.povertyRate,
    medianIncome: deal.medianIncome,
    unemployment: deal.unemployment,
    projectCost: deal.projectCost || intakeData.totalProjectCost,
    allocation: deal.allocation,
    stateNMTCAllocation:
      intakeData.stateNmtcAllocation || intakeData.stateNMTCAllocation,
    htcAmount: intakeData.htcAmount,
    shovelReady: deal.shovelReady,
    completionDate: deal.completionDate || intakeData.projectedCompletionDate,
    financingGap: deal.financingGap,
    totalSources: deal.sources?.reduce((s, x) => s + x.amount, 0),
    totalUses: deal.uses?.reduce((s, x) => s + x.amount, 0),
    sources: deal.sources,
    uses: deal.uses,
    submittedDate: deal.submittedDate,
    programType: deal.programType,
    tractEligible: deal.tractEligible,
    tractSeverelyDistressed: deal.tractSeverelyDistressed,
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header Actions - Hidden when printing */}
      <div className="print:hidden sticky top-0 z-50 bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
              <span className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg">
                Deal Card
              </span>
              <Link
                href={`/deals/${dealId}/profile`}
                className="px-3 py-1.5 bg-gray-800 text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors"
              >
                1-Page Profile
              </Link>
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

      {/* Deal Card - Centered with proper sizing */}
      <div className="flex justify-center items-start py-8 px-4 print:p-0">
        <div ref={cardRef}>
          <DealCardHTML deal={dealCardData} />
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
          #deal-card-html {
            margin: 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
