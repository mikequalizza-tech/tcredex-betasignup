'use client';

import { useState, useEffect } from 'react';
import { useCurrentUser } from '@/lib/auth';
import Link from 'next/link';

type RequestType = 'technical' | 'billing' | 'account' | 'deal' | 'general' | 'feature';

const requestTypes: { value: RequestType; label: string; description: string }[] = [
  { value: 'technical', label: 'Technical Issue', description: 'Bug, error, or platform not working correctly' },
  { value: 'deal', label: 'Deal Support', description: 'Questions about a specific deal or matching' },
  { value: 'account', label: 'Account Help', description: 'Profile, permissions, or access issues' },
  { value: 'billing', label: 'Billing Question', description: 'Invoices, fees, or payment issues' },
  { value: 'feature', label: 'Feature Request', description: 'Suggest a new feature or improvement' },
  { value: 'general', label: 'General Inquiry', description: 'Other questions or feedback' },
];

const priorityLevels = [
  { value: 'low', label: 'Low', description: 'General question, no urgency' },
  { value: 'medium', label: 'Medium', description: 'Need help soon but not blocking' },
  { value: 'high', label: 'High', description: 'Blocking my work, need help today' },
  { value: 'urgent', label: 'Urgent', description: 'Critical issue, deal at risk' },
];

export default function SupportRequestPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    requestType: '' as RequestType | '',
    priority: 'medium',
    dealId: '',
    subject: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const { user, isAuthenticated } = useCurrentUser();
  const [userRole, setUserRole] = useState<string | null>(null);

  // Pre-fill from authenticated user data
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserRole(user.role);
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        organization: user.organization?.name || prev.organization,
      }));
    }
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - in production this would hit /api/support/request
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate mock ticket ID
    const mockTicketId = `TKT-${Date.now().toString(36).toUpperCase()}`;
    setTicketId(mockTicketId);
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-gray-950 min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Request Submitted</h1>
            <p className="text-gray-400 mb-6">
              Your support ticket has been created. We&apos;ll get back to you within one business day.
            </p>
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 inline-block mb-8">
              <p className="text-sm text-gray-500">Ticket ID</p>
              <p className="text-xl font-mono text-indigo-400">{ticketId}</p>
            </div>
            <div className="flex gap-4 justify-center">
              <Link href="/dashboard" className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors">
                Back to Dashboard
              </Link>
              <Link href="/support" className="px-6 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors">
                Support Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-8">
          <Link href="/support" className="text-sm text-indigo-400 hover:text-indigo-300 mb-4 inline-block">
            ← Back to Support
          </Link>
          <h1 className="text-3xl font-bold text-white">Open a Support Request</h1>
          <p className="text-gray-400 mt-2">
            Tell us how we can help. All users can submit support requests regardless of role.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Your Information</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Organization</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Your company or organization"
                />
              </div>
            </div>
            {userRole && (
              <p className="mt-3 text-xs text-gray-500">
                Logged in as <span className="text-indigo-400">{userRole}</span> user
              </p>
            )}
          </div>

          {/* Request Type */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">What do you need help with?</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {requestTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all ${
                    formData.requestType === type.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="requestType"
                    value={type.value}
                    checked={formData.requestType === type.value}
                    onChange={(e) => setFormData({ ...formData, requestType: e.target.value as RequestType })}
                    className="mt-1"
                    required
                  />
                  <div>
                    <p className="font-medium text-gray-200">{type.label}</p>
                    <p className="text-sm text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Priority Level</h2>
            <div className="flex flex-wrap gap-3">
              {priorityLevels.map((level) => (
                <label
                  key={level.value}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-all ${
                    formData.priority === level.value
                      ? level.value === 'urgent' 
                        ? 'border-red-500 bg-red-500/10 text-red-300'
                        : level.value === 'high'
                        ? 'border-orange-500 bg-orange-500/10 text-orange-300'
                        : 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={level.value}
                    checked={formData.priority === level.value}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="sr-only"
                  />
                  <span className="font-medium">{level.label}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {priorityLevels.find(l => l.value === formData.priority)?.description}
            </p>
          </div>

          {/* Details */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Request Details</h2>
            <div className="space-y-4">
              {formData.requestType === 'deal' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Deal ID (if applicable)</label>
                  <input
                    type="text"
                    value={formData.dealId}
                    onChange={(e) => setFormData({ ...formData, dealId: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g., D12345"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Brief summary of your request"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:border-indigo-500 resize-none"
                  placeholder="Please describe your issue or question in detail. Include any error messages, steps to reproduce, or relevant context."
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
            <Link
              href="/support"
              className="px-6 py-3 bg-gray-800 text-gray-200 font-semibold rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
