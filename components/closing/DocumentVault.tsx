'use client';

import { useState } from 'react';

export type DocumentCategory = 
  | 'corporate'
  | 'project'
  | 'financial'
  | 'real_estate'
  | 'legal'
  | 'qalicb'
  | 'insurance'
  | 'closing';

export type DocumentStatus = 'pending' | 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired';

export interface ClosingDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  status: DocumentStatus;
  required: boolean;
  uploadedBy?: string;
  uploadedAt?: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  fileSize?: number;
  fileType?: string;
  notes?: string;
  version: number;
  aiFlags?: string[];
}

const categoryConfig: Record<DocumentCategory, { label: string; icon: string; color: string }> = {
  corporate: { label: 'Corporate/Entity', icon: '🏢', color: 'text-purple-400' },
  project: { label: 'Project Information', icon: '📋', color: 'text-blue-400' },
  financial: { label: 'Financial', icon: '💵', color: 'text-green-400' },
  real_estate: { label: 'Real Estate', icon: '🏠', color: 'text-amber-400' },
  legal: { label: 'Legal/Regulatory', icon: '⚖️', color: 'text-red-400' },
  qalicb: { label: 'QALICB Qualification', icon: '✓', color: 'text-cyan-400' },
  insurance: { label: 'Insurance', icon: '🛡️', color: 'text-indigo-400' },
  closing: { label: 'Closing Documents', icon: '📝', color: 'text-gray-400' },
};

const statusConfig: Record<DocumentStatus, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-gray-400', bg: 'bg-gray-700' },
  uploaded: { label: 'Uploaded', color: 'text-blue-400', bg: 'bg-blue-900/50' },
  under_review: { label: 'Under Review', color: 'text-amber-400', bg: 'bg-amber-900/50' },
  approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-900/50' },
  rejected: { label: 'Rejected', color: 'text-red-400', bg: 'bg-red-900/50' },
  expired: { label: 'Expired', color: 'text-orange-400', bg: 'bg-orange-900/50' },
};

interface DocumentVaultProps {
  documents: ClosingDocument[];
  programType?: 'nmtc' | 'htc' | 'lihtc' | 'oz';
  onUpload?: (category: DocumentCategory, file: File) => void;
  onDownload?: (docId: string) => void;
  onReview?: (docId: string, status: 'approved' | 'rejected', notes?: string) => void;
  canUpload?: boolean;
  canReview?: boolean;
}

export default function DocumentVault({
  documents,
  programType: _programType = 'nmtc',
  onUpload,
  onDownload,
  onReview,
  canUpload = true,
  canReview = false,
}: DocumentVaultProps) {
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('project');

  // Filter documents
  const filteredDocs = documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group by category
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<DocumentCategory, ClosingDocument[]>);

  // Calculate stats
  const stats = {
    total: documents.length,
    required: documents.filter(d => d.required).length,
    uploaded: documents.filter(d => ['uploaded', 'under_review', 'approved'].includes(d.status)).length,
    approved: documents.filter(d => d.status === 'approved').length,
    pending: documents.filter(d => d.status === 'pending').length,
    flagged: documents.filter(d => (d.aiFlags?.length ?? 0) > 0).length,
  };

  const progress = stats.total > 0 ? (stats.approved / stats.required) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Total Documents</p>
          <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Required</p>
          <p className="text-2xl font-bold text-amber-400">{stats.required}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">Approved</p>
          <p className="text-2xl font-bold text-green-400">{stats.approved}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <p className="text-sm text-gray-400">AI Flags</p>
          <p className="text-2xl font-bold text-red-400">{stats.flagged}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-400">Required Documents Progress</span>
          <span className="text-sm font-medium text-gray-200">{Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              progress >= 100 ? 'bg-green-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as DocumentCategory | 'all')}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          {Object.entries(categoryConfig).map(([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          ))}
        </select>
        {canUpload && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <span>↑</span>
            <span>Upload Document</span>
          </button>
        )}
      </div>

      {/* Documents by Category */}
      <div className="space-y-4">
        {(Object.keys(categoryConfig) as DocumentCategory[]).map((category) => {
          const categoryDocs = groupedDocs[category];
          if (!categoryDocs?.length) return null;

          const config = categoryConfig[category];

          return (
            <div key={category} className="border border-gray-700 rounded-lg overflow-hidden">
              {/* Category header */}
              <div className="px-4 py-3 bg-gray-800/50 border-b border-gray-700 flex items-center gap-2">
                <span className={config.color}>{config.icon}</span>
                <span className="font-medium text-gray-200">{config.label}</span>
                <span className="text-sm text-gray-500">({categoryDocs.length})</span>
              </div>

              {/* Documents list */}
              <div className="divide-y divide-gray-800">
                {categoryDocs.map((doc) => (
                  <div key={doc.id} className="p-4 hover:bg-gray-800/30 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* Document icon based on file type */}
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center text-gray-400 flex-shrink-0">
                        {doc.fileType === 'pdf' ? '📄' : doc.fileType === 'docx' ? '📝' : '📁'}
                      </div>

                      {/* Document info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-gray-200 font-medium">{doc.name}</p>
                          {doc.required && (
                            <span className="text-xs text-red-400 font-medium">Required</span>
                          )}
                          {doc.version > 1 && (
                            <span className="text-xs text-gray-500">v{doc.version}</span>
                          )}
                        </div>
                        
                        {doc.uploadedAt && (
                          <p className="text-sm text-gray-500 mt-1">
                            Uploaded by {doc.uploadedBy} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            {doc.fileSize && ` • ${(doc.fileSize / 1024).toFixed(0)} KB`}
                          </p>
                        )}

                        {/* AI Flags */}
                        {doc.aiFlags && doc.aiFlags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {doc.aiFlags.map((flag, i) => (
                              <span key={i} className="px-2 py-1 bg-amber-900/50 text-amber-300 text-xs rounded">
                                ⚠️ {flag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig[doc.status].bg} ${statusConfig[doc.status].color}`}>
                        {statusConfig[doc.status].label}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {doc.status !== 'pending' && (
                          <button
                            onClick={() => onDownload?.(doc.id)}
                            className="p-2 text-gray-400 hover:text-gray-200 transition-colors"
                            title="Download"
                          >
                            ↓
                          </button>
                        )}
                        {canReview && doc.status === 'uploaded' && (
                          <>
                            <button
                              onClick={() => onReview?.(doc.id, 'approved')}
                              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onReview?.(doc.id, 'rejected')}
                              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredDocs.length === 0 && (
        <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg">
          <p className="text-gray-400 text-lg mb-2">No documents found</p>
          <p className="text-gray-500 text-sm">
            {searchQuery ? 'Try adjusting your search' : 'Upload documents to get started'}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">Upload Document</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as DocumentCategory)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200"
                >
                  {Object.entries(categoryConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.icon} {config.label}</option>
                  ))}
                </select>
              </div>

              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      onUpload?.(uploadCategory, file);
                      setShowUploadModal(false);
                    }
                  }}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="text-4xl mb-2">📁</div>
                  <p className="text-gray-400">Click to select file or drag and drop</p>
                  <p className="text-sm text-gray-500 mt-1">PDF, DOC, DOCX, XLS up to 25MB</p>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
