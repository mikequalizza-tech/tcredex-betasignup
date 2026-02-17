'use client';

import { useState } from 'react';

interface Report {
  id: string;
  name: string;
  description: string;
  category: 'deals' | 'cdes' | 'investors' | 'compliance' | 'financial';
  lastRun: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'on-demand';
  format: 'pdf' | 'xlsx' | 'csv';
}

interface ReportResult {
  reportId: string;
  generatedAt: string;
  data: Record<string, string | number>[];
  summary: { label: string; value: string | number }[];
}

const availableReports: Report[] = [
  { id: 'R001', name: 'Deal Pipeline Summary', description: 'Overview of all deals by status, stage, and value', category: 'deals', lastRun: '2024-01-15', frequency: 'daily', format: 'pdf' },
  { id: 'R002', name: 'CDE Allocation Status', description: 'Current allocation and deployment by CDE', category: 'cdes', lastRun: '2024-01-14', frequency: 'weekly', format: 'xlsx' },
  { id: 'R003', name: 'Investor Capital Deployment', description: 'Investor capital flow and deployment metrics', category: 'investors', lastRun: '2024-01-13', frequency: 'weekly', format: 'xlsx' },
  { id: 'R004', name: 'NMTC Compliance Tracker', description: 'Track compliance requirements and deadlines', category: 'compliance', lastRun: '2024-01-12', frequency: 'monthly', format: 'pdf' },
  { id: 'R005', name: 'Fee Revenue Report', description: 'Platform fee revenue and projections', category: 'financial', lastRun: '2024-01-15', frequency: 'monthly', format: 'xlsx' },
  { id: 'R006', name: 'Geographic Distribution', description: 'Deal distribution by state and census tract', category: 'deals', lastRun: '2024-01-10', frequency: 'on-demand', format: 'pdf' },
  { id: 'R007', name: 'Match Success Rate', description: 'AutoMatch performance and conversion metrics', category: 'deals', lastRun: '2024-01-14', frequency: 'weekly', format: 'csv' },
  { id: 'R008', name: 'QEI Deadline Calendar', description: 'Upcoming QEI deadlines and requirements', category: 'compliance', lastRun: '2024-01-15', frequency: 'daily', format: 'pdf' },
];

// Mock report data generators
const generateReportData = (reportId: string): ReportResult => {
  const now = new Date().toISOString();
  
  switch (reportId) {
    case 'R001': // Deal Pipeline
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Total Deals', value: 47 },
          { label: 'Pipeline Value', value: '$892M' },
          { label: 'Avg Deal Size', value: '$19M' },
          { label: 'Conversion Rate', value: '34%' },
        ],
        data: [
          { stage: 'Intake', count: 12, value: '$156M', avgDays: 5 },
          { stage: 'Underwriting', count: 8, value: '$184M', avgDays: 21 },
          { stage: 'CDE Matching', count: 15, value: '$298M', avgDays: 14 },
          { stage: 'Term Sheet', count: 7, value: '$142M', avgDays: 18 },
          { stage: 'Closing', count: 5, value: '$112M', avgDays: 45 },
        ]
      };
    case 'R002': // CDE Allocation
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Active CDEs', value: 4 },
          { label: 'Total Allocation', value: '$340M' },
          { label: 'Available', value: '$90M' },
          { label: 'Utilization', value: '73.5%' },
        ],
        data: [
          { cde: 'Clearwater CDE', allocation: '$75M', deployed: '$52M', available: '$23M', utilization: '69%' },
          { cde: 'Midwest Community', allocation: '$120M', deployed: '$89M', available: '$31M', utilization: '74%' },
          { cde: 'Southern Impact', allocation: '$50M', deployed: '$48M', available: '$2M', utilization: '96%' },
          { cde: 'Great Lakes', allocation: '$95M', deployed: '$61M', available: '$34M', utilization: '64%' },
        ]
      };
    case 'R003': // Investor Capital
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Total Investors', value: 5 },
          { label: 'Capital Capacity', value: '$770M' },
          { label: 'Deployed YTD', value: '$488M' },
          { label: 'Available', value: '$282M' },
        ],
        data: [
          { investor: 'Midwest Regional Bank', type: 'Bank', capacity: '$150M', deployed: '$95M', available: '$55M' },
          { investor: 'National Life Insurance', type: 'Insurance', capacity: '$200M', deployed: '$142M', available: '$58M' },
          { investor: 'GreenTech Industries', type: 'Corporate', capacity: '$45M', deployed: '$32M', available: '$13M' },
          { investor: 'Harrison Family Office', type: 'Family Office', capacity: '$75M', deployed: '$41M', available: '$34M' },
          { investor: 'Impact Capital Fund III', type: 'Fund', capacity: '$300M', deployed: '$178M', available: '$122M' },
        ]
      };
    case 'R004': // Compliance
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Open Items', value: 8 },
          { label: 'Due This Month', value: 3 },
          { label: 'Overdue', value: 1 },
          { label: 'Compliance Rate', value: '94%' },
        ],
        data: [
          { item: 'Annual Report - Clearwater', dueDate: '2024-02-15', status: 'Pending', priority: 'High' },
          { item: 'QEI Certification - Deal #2847', dueDate: '2024-01-28', status: 'In Progress', priority: 'High' },
          { item: 'Jobs Report - Q4', dueDate: '2024-01-31', status: 'Pending', priority: 'Medium' },
          { item: 'Allocation Amendment', dueDate: '2024-01-20', status: 'Overdue', priority: 'Critical' },
          { item: 'Community Impact Assessment', dueDate: '2024-02-28', status: 'Not Started', priority: 'Low' },
        ]
      };
    case 'R005': // Fee Revenue
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Total Revenue YTD', value: '$2.4M' },
          { label: 'This Month', value: '$312K' },
          { label: 'Projected Q1', value: '$890K' },
          { label: 'Growth', value: '+18%' },
        ],
        data: [
          { month: 'October 2023', closingFees: '$245K', servicingFees: '$78K', total: '$323K' },
          { month: 'November 2023', closingFees: '$198K', servicingFees: '$82K', total: '$280K' },
          { month: 'December 2023', closingFees: '$312K', servicingFees: '$85K', total: '$397K' },
          { month: 'January 2024', closingFees: '$225K', servicingFees: '$87K', total: '$312K' },
        ]
      };
    case 'R006': // Geographic
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'States Covered', value: 18 },
          { label: 'Census Tracts', value: 124 },
          { label: 'Severely Distressed', value: 67 },
          { label: 'Avg Poverty Rate', value: '32%' },
        ],
        data: [
          { state: 'Illinois', deals: 12, value: '$156M', avgDistress: 'High' },
          { state: 'Ohio', deals: 8, value: '$98M', avgDistress: 'Severe' },
          { state: 'Michigan', deals: 6, value: '$72M', avgDistress: 'High' },
          { state: 'Indiana', deals: 5, value: '$61M', avgDistress: 'Moderate' },
          { state: 'Missouri', deals: 4, value: '$52M', avgDistress: 'High' },
        ]
      };
    case 'R007': // Match Success
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Total Matches', value: 156 },
          { label: 'Accepted', value: 89 },
          { label: 'Success Rate', value: '57%' },
          { label: 'Avg Time to Match', value: '4.2 days' },
        ],
        data: [
          { week: 'Week 1', matches: 38, accepted: 21, rate: '55%', avgScore: 82 },
          { week: 'Week 2', matches: 42, accepted: 26, rate: '62%', avgScore: 85 },
          { week: 'Week 3', matches: 35, accepted: 18, rate: '51%', avgScore: 79 },
          { week: 'Week 4', matches: 41, accepted: 24, rate: '59%', avgScore: 84 },
        ]
      };
    case 'R008': // QEI Deadlines
      return {
        reportId, generatedAt: now,
        summary: [
          { label: 'Upcoming QEIs', value: 6 },
          { label: 'This Month', value: 2 },
          { label: 'At Risk', value: 1 },
          { label: 'Completed YTD', value: 14 },
        ],
        data: [
          { deal: 'Midwest Medical Center', qeiDate: '2024-01-25', amount: '$8.5M', status: 'On Track', cde: 'Clearwater' },
          { deal: 'Detroit Tech Hub', qeiDate: '2024-01-30', amount: '$12M', status: 'At Risk', cde: 'Great Lakes' },
          { deal: 'Columbus Community', qeiDate: '2024-02-15', amount: '$6.2M', status: 'On Track', cde: 'Midwest' },
          { deal: 'Chicago Childcare', qeiDate: '2024-02-28', amount: '$4.8M', status: 'Pending Docs', cde: 'Clearwater' },
        ]
      };
    default:
      return { reportId, generatedAt: now, summary: [], data: [] };
  }
};

const categoryColors = {
  deals: 'bg-blue-500/20 text-blue-400',
  cdes: 'bg-purple-500/20 text-purple-400',
  investors: 'bg-green-500/20 text-green-400',
  compliance: 'bg-orange-500/20 text-orange-400',
  financial: 'bg-indigo-500/20 text-indigo-400',
};

const formatIcons = { pdf: '📄', xlsx: '📊', csv: '📋' };

export default function AdminReportsPage() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<ReportResult | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const filteredReports = availableReports.filter((report) => categoryFilter === 'all' || report.category === categoryFilter);

  const handleGenerateReport = async (report: Report) => {
    setIsGenerating(true);
    setSelectedReport(report);
    
    // Simulate generation delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const result = generateReportData(report.id);
    setReportResult(result);
    setIsGenerating(false);
    setShowResultsModal(true);
  };

  const handleDownload = () => {
    if (!selectedReport || !reportResult) return;
    
    // Create downloadable content
    const content = JSON.stringify(reportResult, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedReport.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Reports</h1>
              <p className="text-sm text-gray-400">Generate and download platform reports</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">+ Create Custom Report</button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-4 grid grid-cols-5 gap-4 border-b border-gray-800">
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Total Reports</p>
          <p className="text-2xl font-bold text-gray-100">{availableReports.length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Deal Reports</p>
          <p className="text-2xl font-bold text-blue-400">{availableReports.filter(r => r.category === 'deals').length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">CDE Reports</p>
          <p className="text-2xl font-bold text-purple-400">{availableReports.filter(r => r.category === 'cdes').length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Compliance</p>
          <p className="text-2xl font-bold text-orange-400">{availableReports.filter(r => r.category === 'compliance').length}</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
          <p className="text-sm text-gray-400">Financial</p>
          <p className="text-2xl font-bold text-green-400">{availableReports.filter(r => r.category === 'financial').length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-gray-800 flex gap-4 items-center">
        <span className="text-sm text-gray-400">Filter by category:</span>
        <div className="flex gap-2">
          {['all', 'deals', 'cdes', 'investors', 'compliance', 'financial'].map((cat) => (
            <button key={cat} onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${categoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Reports Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div key={report.id} className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-indigo-500 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{formatIcons[report.format]}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${categoryColors[report.category]}`}>
                    {report.category.toUpperCase()}
                  </span>
                </div>
                <span className="text-xs text-gray-500 uppercase">{report.format}</span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-100 mb-1">{report.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{report.description}</p>
              
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-gray-500">Last run: {report.lastRun}</span>
                <span className="text-gray-500 capitalize">{report.frequency}</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleGenerateReport(report)} disabled={isGenerating}
                  className="flex-1 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50">
                  {isGenerating && selectedReport?.id === report.id ? 'Generating...' : 'Generate'}
                </button>
                <button className="px-3 py-2 bg-gray-800 text-gray-200 text-sm rounded-lg hover:bg-gray-700 transition-colors">Schedule</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 pb-6">
        <h2 className="text-lg font-semibold text-gray-100 mb-4">Recent Report Activity</h2>
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Report</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Generated By</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Format</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              <tr className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-200">Deal Pipeline Summary</td>
                <td className="px-4 py-3 text-sm text-gray-400">System Admin</td>
                <td className="px-4 py-3 text-sm text-gray-400">Jan 15, 2024</td>
                <td className="px-4 py-3 text-sm text-gray-400">PDF</td>
                <td className="px-4 py-3"><button className="text-xs text-indigo-400 hover:text-indigo-300">Download</button></td>
              </tr>
              <tr className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-200">CDE Allocation Status</td>
                <td className="px-4 py-3 text-sm text-gray-400">System (Auto)</td>
                <td className="px-4 py-3 text-sm text-gray-400">Jan 14, 2024</td>
                <td className="px-4 py-3 text-sm text-gray-400">XLSX</td>
                <td className="px-4 py-3"><button className="text-xs text-indigo-400 hover:text-indigo-300">Download</button></td>
              </tr>
              <tr className="hover:bg-gray-800/50">
                <td className="px-4 py-3 text-sm text-gray-200">Match Success Rate</td>
                <td className="px-4 py-3 text-sm text-gray-400">System (Auto)</td>
                <td className="px-4 py-3 text-sm text-gray-400">Jan 14, 2024</td>
                <td className="px-4 py-3 text-sm text-gray-400">CSV</td>
                <td className="px-4 py-3"><button className="text-xs text-indigo-400 hover:text-indigo-300">Download</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Results Modal */}
      {showResultsModal && selectedReport && reportResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-xl border border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-800">
              <div>
                <h2 className="text-lg font-semibold text-gray-100">{selectedReport.name}</h2>
                <p className="text-sm text-gray-400">Generated {new Date(reportResult.generatedAt).toLocaleString()}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={handleDownload} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 transition-colors">
                  Download
                </button>
                <button onClick={() => setShowResultsModal(false)} className="px-4 py-2 bg-gray-800 text-gray-200 text-sm rounded-lg hover:bg-gray-700 transition-colors">
                  Close
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                {reportResult.summary.map((item, i) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">{item.label}</p>
                    <p className="text-2xl font-bold text-indigo-400">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Data Table */}
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      {reportResult.data[0] && Object.keys(reportResult.data[0]).map((key) => (
                        <th key={key} className="text-left px-4 py-3 text-xs font-medium text-gray-300 uppercase">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {reportResult.data.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-750">
                        {Object.values(row).map((value, j) => (
                          <td key={j} className="px-4 py-3 text-sm text-gray-200">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
