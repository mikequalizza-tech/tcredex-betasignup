'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import DocumentUploader from '@/components/documents/DocumentUploader';
import { EntityType } from '@/lib/documents/types';

// Demo projects/deals for selection
const demoEntities = {
  organization: [
    { id: 'org1', name: 'Demo Organization' },
  ],
  project: [
    { id: 'P001', name: 'Eastside Grocery Co-Op' },
    { id: 'P002', name: 'Northgate Health Center' },
    { id: 'P003', name: 'Youth Training Center' },
  ],
  deal: [
    { id: 'D001', name: 'Eastside Grocery Deal' },
    { id: 'D002', name: 'Northgate Health Deal' },
  ],
};

function DocumentUploadPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pre-fill from URL params
  const prefilledEntityType = searchParams?.get('entityType') as EntityType | null;
  const prefilledEntityId = searchParams?.get('entityId');
  const _prefilledProjectId = searchParams?.get('projectId');
  
  const [step, setStep] = useState<'select' | 'upload'>(prefilledEntityType ? 'upload' : 'select');
  const [selectedEntityType, setSelectedEntityType] = useState<EntityType>(prefilledEntityType || 'organization');
  const [selectedEntityId, setSelectedEntityId] = useState<string>(prefilledEntityId || '');
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');

  // Update entity name when selection changes
  useEffect(() => {
    if (selectedEntityId && selectedEntityType !== 'user') {
      const entities = demoEntities[selectedEntityType as keyof typeof demoEntities] || [];
      const entity = entities.find(e => e.id === selectedEntityId);
      setSelectedEntityName(entity?.name || '');
    }
  }, [selectedEntityId, selectedEntityType]);

  // Pre-fill entity name if provided
  useEffect(() => {
    if (prefilledEntityType && prefilledEntityId) {
      const entities = demoEntities[prefilledEntityType as keyof typeof demoEntities] || [];
      const entity = entities.find(e => e.id === prefilledEntityId);
      if (entity) {
        setSelectedEntityName(entity.name);
      }
    }
  }, [prefilledEntityType, prefilledEntityId]);

  const handleEntitySelect = () => {
    if (!selectedEntityId) return;
    setStep('upload');
  };

  const handleUploadComplete = (documentId: string) => {
    // Redirect to the document detail page or back to documents list
    router.push(`/dashboard/documents/${documentId}`);
  };

  const handleCancel = () => {
    if (step === 'upload' && !prefilledEntityType) {
      setStep('select');
    } else {
      router.push('/dashboard/documents');
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/documents" className="text-gray-400 hover:text-white">
          Documents
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">Upload</span>
      </nav>

      {/* Step 1: Select Entity */}
      {step === 'select' && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">Upload Document</h1>
          <p className="text-gray-400 mb-6">
            First, select where this document belongs.
          </p>

          <div className="space-y-4">
            {/* Entity Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Document Type
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['organization', 'project', 'deal'] as EntityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setSelectedEntityType(type);
                      setSelectedEntityId('');
                    }}
                    className={`p-4 rounded-lg border text-center transition-colors ${
                      selectedEntityType === type
                        ? 'border-indigo-500 bg-indigo-900/20 text-indigo-300'
                        : 'border-gray-700 hover:border-gray-600 text-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-1">
                      {type === 'organization' && '🏢'}
                      {type === 'project' && '📋'}
                      {type === 'deal' && '💼'}
                    </div>
                    <span className="text-sm font-medium capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Entity Selection */}
            {selectedEntityType !== 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select {selectedEntityType}
                </label>
                <select
                  value={selectedEntityId}
                  onChange={(e) => setSelectedEntityId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Choose a {selectedEntityType}...</option>
                  {demoEntities[selectedEntityType as keyof typeof demoEntities]?.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEntitySelect}
                disabled={!selectedEntityId}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  selectedEntityId
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Upload Document */}
      {step === 'upload' && (
        <DocumentUploader
          entityType={selectedEntityType}
          entityId={selectedEntityId}
          entityName={selectedEntityName}
          onUploadComplete={handleUploadComplete}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function DocumentUploadPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <DocumentUploadPageContent />
    </Suspense>
  );
}
