'use client';

import { useState } from 'react';
import { SETUP_SQL } from '@/lib/knowledge/setup-sql';

export default function KnowledgeSetupPage() {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SETUP_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Knowledge Base Setup</h1>
        <p className="text-gray-500 mb-8">
          Run this SQL in your Supabase SQL Editor to set up the knowledge base tables.
        </p>

        {/* Prerequisites */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-amber-800 mb-2">Prerequisites</h2>
          <ul className="text-sm text-amber-700 space-y-1">
            <li>✓ Supabase project with pgvector extension available</li>
            <li>✓ NEXT_PUBLIC_SUPABASE_URL in .env.local</li>
            <li>✓ SUPABASE_SERVICE_ROLE_KEY in .env.local</li>
            <li>✓ OPENAI_API_KEY in .env.local (for embeddings)</li>
            <li>✓ ANTHROPIC_API_KEY in .env.local (for ChatTC)</li>
          </ul>
        </div>

        {/* Environment Variables */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">Required Environment Variables</h2>
          <pre className="text-sm bg-gray-50 p-4 rounded overflow-x-auto">
{`# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...

# Anthropic (for ChatTC)
ANTHROPIC_API_KEY=sk-ant-...`}
          </pre>
        </div>

        {/* SQL */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Setup SQL</h2>
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
            >
              {copied ? '✓ Copied!' : 'Copy SQL'}
            </button>
          </div>
          <pre className="p-4 text-sm overflow-x-auto bg-gray-900 text-gray-100 max-h-[600px]">
            {SETUP_SQL}
          </pre>
        </div>

        {/* Steps */}
        <div className="mt-8 space-y-4">
          <h2 className="font-semibold text-gray-900">Setup Steps</h2>
          
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium text-gray-900">Copy the SQL above</p>
                <p className="text-sm text-gray-500">Click "Copy SQL" button</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium text-gray-900">Open Supabase SQL Editor</p>
                <p className="text-sm text-gray-500">Go to your Supabase project → SQL Editor</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium text-gray-900">Run the SQL</p>
                <p className="text-sm text-gray-500">Paste and execute the SQL to create tables and functions</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium text-gray-900">Set environment variables</p>
                <p className="text-sm text-gray-500">Add the required keys to your .env.local file</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-medium">5</div>
              <div>
                <p className="font-medium text-gray-900">Upload documents</p>
                <p className="text-sm text-gray-500">Go to /admin/knowledge to start uploading documents</p>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-800 mb-2">Recommended First Documents</h2>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• CDFI Fund NMTC FAQs (cdfinmtcfaqsacs09012023.pdf)</li>
            <li>• NMTC Allocation Books (2009, 2015-2016)</li>
            <li>• HTC NMTC Overview (HTC_NMTC_Overview.pdf)</li>
            <li>• tCredex Platform Blueprints</li>
            <li>• Intake Form v4 Spec</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
