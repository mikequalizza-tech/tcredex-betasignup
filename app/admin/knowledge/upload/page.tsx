'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CATEGORY_INFO, KnowledgeCategory } from '@/lib/knowledge/types';

export default function UploadDocumentPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<KnowledgeCategory>('general');
  const [program, setProgram] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<string>('');

  const handleFileSelect = useCallback((selectedFile: File) => {
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!allowedTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.md')) {
      setError('Please upload a PDF, TXT, MD, or DOC file');
      return;
    }

    setFile(selectedFile);
    setError('');
    
    // Auto-fill title from filename
    if (!title) {
      const autoTitle = selectedFile.name
        .replace(/\.[^/.]+$/, '') // Remove extension
        .replace(/[_-]/g, ' ')    // Replace underscores/hyphens with spaces
        .replace(/\s+/g, ' ')     // Normalize spaces
        .trim();
      setTitle(autoTitle);
    }

    // Auto-detect category from filename
    const filename = selectedFile.name.toLowerCase();
    if (filename.includes('nmtc') || filename.includes('new_market')) {
      setCategory('nmtc');
    } else if (filename.includes('htc') || filename.includes('historic')) {
      setCategory('htc');
    } else if (filename.includes('lihtc') || filename.includes('housing')) {
      setCategory('lihtc');
    } else if (filename.includes('oz') || filename.includes('opportunity')) {
      setCategory('oz');
    } else if (filename.includes('tcredex') || filename.includes('platform')) {
      setCategory('platform');
    }
  }, [title]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!file || !title) {
      setError('Please select a file and provide a title');
      return;
    }

    setIsUploading(true);
    setError('');
    setProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);
      if (program) formData.append('program', program);

      setProgress('Processing document...');

      const response = await fetch('/api/knowledge/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setProgress(`Success! Created ${data.chunkCount} chunks`);
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/admin/knowledge');
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setProgress('');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/knowledge" className="text-green-600 hover:underline text-sm mb-2 inline-block">
          ← Back to Knowledge Base
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
        <p className="text-gray-500">Add a document to ChatTC's knowledge base</p>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        {/* File Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            file ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          {file ? (
            <div>
              <div className="text-green-600 mb-2">✓ File selected</div>
              <div className="font-medium text-gray-900">{file.name}</div>
              <div className="text-sm text-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </div>
              <button
                onClick={() => setFile(null)}
                className="mt-2 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : (
            <div>
              <div className="text-gray-400 text-4xl mb-2">📄</div>
              <div className="text-gray-600 mb-2">
                Drag & drop a file here, or click to browse
              </div>
              <div className="text-sm text-gray-400">
                Supported: PDF, TXT, MD, DOC, DOCX
              </div>
              <input
                type="file"
                accept=".pdf,.txt,.md,.doc,.docx"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                style={{ position: 'absolute', top: 0, left: 0 }}
              />
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Document Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., NMTC Program Guide 2023"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key as KnowledgeCategory)}
                className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  category === key
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {CATEGORY_INFO[category].description}
          </p>
        </div>

        {/* Program (optional) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Specific Program (optional)
          </label>
          <input
            type="text"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g., Federal NMTC, Virginia HTC"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            For state-specific or program-specific documents
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {progress}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3">
          <button
            onClick={handleUpload}
            disabled={isUploading || !file || !title}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Processing...' : 'Upload & Process'}
          </button>
          <Link
            href="/admin/knowledge"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tips for best results</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use clear, descriptive titles that indicate the document's content</li>
          <li>• PDFs with selectable text work best (not scanned images)</li>
          <li>• Categorize accurately to improve retrieval relevance</li>
          <li>• Large documents (50+ pages) will be split into many chunks</li>
        </ul>
      </div>
    </div>
  );
}
