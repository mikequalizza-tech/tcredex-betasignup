'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  DocumentCategory,
  EntityType,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TAGS,
  DocumentTag,
  TAG_COLORS,
} from '@/lib/documents/types';

// Demo entities for selection
const demoEntities = {
  organization: [{ id: 'org1', name: 'Demo Organization' }],
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

function NewDocumentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Pre-fill from URL params
  const prefilledEntityType = searchParams?.get('entityType') as EntityType | null;
  const prefilledEntityId = searchParams?.get('entityId');
  const prefilledProjectId = searchParams?.get('projectId');

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [entityType, setEntityType] = useState<EntityType>(prefilledEntityType || 'project');
  const [entityId, setEntityId] = useState(prefilledEntityId || '');
  const [projectId, setProjectId] = useState(prefilledProjectId || '');
  const [dealId, setDealId] = useState('');
  const [selectedTags, setSelectedTags] = useState<DocumentTag[]>([]);
  const [requiredForClosing, setRequiredForClosing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTagToggle = (tag: DocumentTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !entityId) return;

    setIsSubmitting(true);

    try {
      // TODO: API call to create document metadata shell
      // const response = await fetch('/api/documents', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     name,
      //     description,
      //     category,
      //     entityType,
      //     entityId,
      //     projectId: projectId || undefined,
      //     dealId: dealId || undefined,
      //     tags: selectedTags,
      //     requiredForClosing,
      //   }),
      // });
      // const { id } = await response.json();

      // Simulate success
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockId = `doc-${Date.now()}`;

      // Redirect to upload page with the new document ID
      router.push(`/dashboard/documents/upload?documentId=${mockId}&entityType=${entityType}&entityId=${entityId}`);
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const _getEntityName = () => {
    if (!entityId || entityType === 'user') return '';
    const entities = demoEntities[entityType as keyof typeof demoEntities] || [];
    return entities.find(e => e.id === entityId)?.name || '';
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link href="/dashboard/documents" className="text-gray-400 hover:text-white">
          Documents
        </Link>
        <span className="text-gray-600">/</span>
        <span className="text-gray-200">New Document</span>
      </nav>

      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Create Document</h1>
        <p className="text-gray-400 mb-6">
          Set up document metadata first, then upload the file.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Document Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Document Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Phase I Environmental Assessment"
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this document..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(DOCUMENT_CATEGORIES).map(([key, { label }]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key as DocumentCategory)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    category === key
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Entity Type & Selection */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Belongs To <span className="text-red-400">*</span>
              </label>
              <select
                value={entityType}
                onChange={(e) => {
                  setEntityType(e.target.value as EntityType);
                  setEntityId('');
                }}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="organization">Organization</option>
                <option value="project">Project</option>
                <option value="deal">Deal</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Select {entityType} <span className="text-red-400">*</span>
              </label>
              <select
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="">Choose...</option>
                {demoEntities[entityType as keyof typeof demoEntities]?.map((entity) => (
                  <option key={entity.id} value={entity.id}>{entity.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Project/Deal Linking (optional secondary associations) */}
          {entityType === 'organization' && (
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Link to Project <span className="text-gray-500">(optional)</span>
                </label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None</option>
                  {demoEntities.project.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Link to Deal <span className="text-gray-500">(optional)</span>
                </label>
                <select
                  value={dealId}
                  onChange={(e) => setDealId(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">None</option>
                  {demoEntities.deal.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {DOCUMENT_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? TAG_COLORS[tag] + ' ring-2 ring-white/20'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Required for Closing */}
          <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              checked={requiredForClosing}
              onChange={(e) => setRequiredForClosing(e.target.checked)}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-indigo-500 focus:ring-indigo-500"
            />
            <div>
              <span className="text-gray-200 font-medium">Required for Closing</span>
              <p className="text-sm text-gray-500">Mark this document as required to complete the transaction</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
            <Link
              href="/dashboard/documents"
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={!name || !entityId || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                !name || !entityId || isSubmitting
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Continue to Upload'}
            </button>
          </div>
        </form>
      </div>
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

export default function NewDocumentPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewDocumentPageContent />
    </Suspense>
  );
}
