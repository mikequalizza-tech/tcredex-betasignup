'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useCurrentUser } from '@/lib/auth';
import { fetchApi, apiPut } from '@/lib/api/fetch-utils';

/** Organization form data — union of all role-specific fields */
interface OrgFormData {
  name?: string;
  type?: string;
  description?: string;
  website?: string;
  primary_contact_name?: string;
  primary_contact_email?: string;
  phone?: string;
  year_founded?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  // CDE AUTOMATCH fields
  primary_states?: string[];
  target_sectors?: string[];
  min_deal_size?: number;
  max_deal_size?: number;
  small_deal_fund?: boolean;
  require_severely_distressed?: boolean;
  require_qct?: boolean;
  preferred_project_types?: string[];
  service_area_type?: string;
  rural_focus?: boolean;
  urban_focus?: boolean;
  // Investor AUTOMATCH fields
  min_investment?: number;
  max_investment?: number;
  target_states?: string[];
  preferred_states?: string[];
  preferred_sectors?: string[];
  target_credit_types?: string[];
  programs?: string[];
  [key: string]: unknown; // allow additional dynamic fields from API
}

/** Raw CDE row from API */
interface RawCDE {
  id: string;
  organization_id?: string;
  primary_states?: string[];
  target_sectors?: string[];
  min_deal_size?: string | number;
  max_deal_size?: string | number;
  small_deal_fund?: boolean;
  require_severely_distressed?: boolean;
  require_qct?: boolean;
  preferred_project_types?: string[];
  service_area_type?: string;
  rural_focus?: boolean;
  urban_focus?: boolean;
}

/** Raw Investor row from API */
interface RawInvestor {
  id: string;
  min_investment?: string | number;
  max_investment?: string | number;
  target_states?: string[];
  preferred_sectors?: string[];
  target_credit_types?: string[];
}

export default function OrganizationInfoPage() {
  return (
    <ProtectedRoute>
      <OrganizationInfoContent />
    </ProtectedRoute>
  );
}

function OrganizationInfoContent() {
  const { orgType, organizationId, orgName } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Form state - will be role-specific
  const [formData, setFormData] = useState<OrgFormData>({});
  const [cdeId, setCdeId] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrganizationData() {
      if (!organizationId) {
        setLoading(false);
        return;
      }

      try {
        // Load organization data
        const result = await fetchApi<{ organization: OrgFormData }>(`/api/organization?id=${encodeURIComponent(organizationId)}`);
        if (result.success && result.data?.organization) {
          setFormData(result.data.organization);
        } else {
          // Organization doesn't exist yet - pre-populate with available data from user context
          console.log('Organization not found, initializing with defaults');
          setFormData({
            name: orgName || '',
            type: orgType || 'sponsor',
          });
        }

        // If CDE, also load CDE-specific AUTOMATCH data from cdes table
        if (orgType === 'cde') {
          try {
            // Use API to get CDE data (CDEs see only their own profile)
            const cdeResult = await fetchApi<{ cdes?: RawCDE[] }>(`/api/cdes`);
            if (cdeResult.success && cdeResult.data?.cdes && Array.isArray(cdeResult.data.cdes) && cdeResult.data.cdes.length > 0) {
              // Find CDE matching this organization
              const cdeData = cdeResult.data.cdes.find((cde) => cde.organization_id === organizationId) || cdeResult.data.cdes[0];
              if (cdeData) {
                setCdeId(cdeData.id);
                setFormData((prev) => ({
                  ...prev,
                  // AUTOMATCH fields from CDE table
                  primary_states: cdeData.primary_states || [],
                  target_sectors: cdeData.target_sectors || [],
                  min_deal_size: cdeData.min_deal_size ? parseFloat(cdeData.min_deal_size.toString()) : 0,
                  max_deal_size: cdeData.max_deal_size ? parseFloat(cdeData.max_deal_size.toString()) : 0,
                  small_deal_fund: cdeData.small_deal_fund || false,
                  require_severely_distressed: cdeData.require_severely_distressed || false,
                  require_qct: cdeData.require_qct || false,
                  preferred_project_types: cdeData.preferred_project_types || [],
                  service_area_type: cdeData.service_area_type || 'national',
                  rural_focus: cdeData.rural_focus || false,
                  urban_focus: cdeData.urban_focus !== undefined ? cdeData.urban_focus : true,
                }));
              }
            }
          } catch (cdeError) {
            console.error('Failed to load CDE data:', cdeError);
          }
        }

        // If Investor, also load investor-specific AUTOMATCH data
        if (orgType === 'investor') {
          try {
            const investorResult = await fetchApi<{ investors?: RawInvestor[] }>(`/api/investors`);
            if (investorResult.success && investorResult.data?.investors && Array.isArray(investorResult.data.investors) && investorResult.data.investors.length > 0) {
              const investorData = investorResult.data.investors[0];
              setFormData((prev) => ({
                ...prev,
                // AUTOMATCH fields from investors table
                min_investment: investorData.min_investment ? parseFloat(investorData.min_investment.toString()) : 0,
                max_investment: investorData.max_investment ? parseFloat(investorData.max_investment.toString()) : 0,
                target_states: investorData.target_states || [],
                preferred_sectors: investorData.preferred_sectors || [],
                target_credit_types: investorData.target_credit_types || [],
              }));
            }
          } catch (investorError) {
            console.error('Failed to load investor data:', investorError);
          }
        }
      } catch (error) {
        console.error('Failed to load organization data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadOrganizationData();
  }, [organizationId, orgType, orgName]);

  const handleSave = async () => {
    if (!organizationId) return;

    setSaving(true);
    setSaved(false);
    try {
      // Separate organization data from role-specific AUTOMATCH data
      const {
        // CDE fields
        primary_states,
        target_sectors,
        min_deal_size,
        max_deal_size,
        small_deal_fund,
        require_severely_distressed,
        require_qct,
        preferred_project_types,
        service_area_type,
        rural_focus,
        urban_focus,
        // Investor fields
        min_investment,
        max_investment,
        target_states,
        preferred_sectors,
        target_credit_types,
        ...orgData
      } = formData;

      // Save organization data using PUT method
      const result = await apiPut<{ organization: OrgFormData; success: boolean }>('/api/organization', {
        id: organizationId,
        ...orgData,
      });

      if (!result.success) {
        throw new Error('Failed to save organization data');
      }

      // If CDE, also save AUTOMATCH preferences to CDE table
      if (orgType === 'cde' && cdeId) {
        try {
          const cdeUpdateData: Record<string, unknown> = {
            primary_states: Array.isArray(primary_states) ? primary_states : [],
            target_sectors: Array.isArray(target_sectors) ? target_sectors : [],
            min_deal_size: min_deal_size || 0,
            max_deal_size: max_deal_size || 0,
            small_deal_fund: small_deal_fund || false,
            require_severely_distressed: require_severely_distressed || false,
            require_qct: require_qct || false,
            preferred_project_types: Array.isArray(preferred_project_types) ? preferred_project_types : [],
            service_area_type: service_area_type || 'national',
            rural_focus: rural_focus || false,
            urban_focus: urban_focus !== undefined ? urban_focus : true,
            updated_at: new Date().toISOString(),
          };

          const response = await fetch(`/api/cdes/${cdeId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(cdeUpdateData),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            console.warn('Failed to save CDE AUTOMATCH data:', errorData);
            // Don't fail the whole save, just warn
          }
        } catch (cdeError) {
          console.error('Failed to save CDE AUTOMATCH data:', cdeError);
          // Don't fail the whole save, just log the error
        }
      }

      // If Investor, also save AUTOMATCH preferences to investors table
      if (orgType === 'investor') {
        try {
          const investorUpdateData: Record<string, unknown> = {
            min_investment: min_investment || 0,
            max_investment: max_investment || 0,
            target_states: Array.isArray(target_states) ? target_states : [],
            preferred_sectors: Array.isArray(preferred_sectors) ? preferred_sectors : [],
            target_credit_types: Array.isArray(target_credit_types) ? target_credit_types : [],
          };

          const investorResult = await apiPut<{ success: boolean }>('/api/investors', investorUpdateData);
          if (!investorResult.success) {
            console.warn('Failed to save investor AUTOMATCH data:', investorResult);
            // Don't fail the whole save, just warn
          }
        } catch (investorError) {
          console.error('Failed to save investor AUTOMATCH data:', investorError);
          // Don't fail the whole save, just log the error
        }
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save organization data:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-100">Organization Information</h1>
            <p className="text-gray-400 mt-1">
              Complete your organization profile to improve AutoMatch accuracy and help CDEs and investors find you.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 space-y-6">
            {/* Basic Organization Information */}
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-100 mb-1">
                  {orgType === 'sponsor' && 'Sponsor Profile'}
                  {orgType === 'cde' && 'CDE Profile'}
                  {orgType === 'investor' && 'Investor Profile'}
                  {!orgType && 'Organization Profile'}
                </h2>
                <p className="text-sm text-gray-400">
                  {orgType === 'sponsor' && 'Complete your sponsor profile to help CDEs and investors understand your organization.'}
                  {orgType === 'cde' && 'Complete your CDE profile to help AutoMatch connect you with the right projects.'}
                  {orgType === 'investor' && 'Complete your investor profile to help AutoMatch connect you with the right opportunities.'}
                  {!orgType && 'Complete your organization profile to improve AutoMatch accuracy.'}
                </p>
              </div>

              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter organization name"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe your organization, mission, and focus areas"
                  rows={4}
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com"
                />
              </div>

              {/* Contact Information Section */}
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-md font-semibold text-gray-100 mb-4">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Contact Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.primary_contact_name || ''}
                      onChange={(e) => setFormData({ ...formData, primary_contact_name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Primary Contact Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.primary_contact_email || ''}
                      onChange={(e) => setFormData({ ...formData, primary_contact_email: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="contact@example.com"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  {/* Year Founded */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Year Founded
                    </label>
                    <input
                      type="text"
                      value={formData.year_founded || ''}
                      onChange={(e) => setFormData({ ...formData, year_founded: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="2020"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>

              {/* Address Section */}
              <div className="pt-4 border-t border-gray-800">
                <h3 className="text-md font-semibold text-gray-100 mb-4">Address</h3>
                
                {/* Address Line 1 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={formData.address_line1 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="123 Main Street"
                  />
                </div>

                {/* Address Line 2 */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={formData.address_line2 || ''}
                    onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Suite 100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="New York"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={formData.state || ''}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="NY"
                      maxLength={2}
                    />
                  </div>

                  {/* ZIP Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={formData.zip_code || ''}
                      onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* AUTOMATCH Preferences Section - CDE */}
            {orgType === 'cde' && (
              <div className="pt-6 border-t border-gray-800 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100 mb-1">AutoMatch Preferences</h2>
                  <p className="text-sm text-gray-400">
                    Configure your matching preferences to help AutoMatch connect you with the right projects.
                  </p>
                </div>

                {/* Geographic Focus */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Geographic Focus</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Service Area Type
                    </label>
                    <select
                      value={formData.service_area_type || 'national'}
                      onChange={(e) => setFormData({ ...formData, service_area_type: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="national">National</option>
                      <option value="regional">Regional</option>
                      <option value="state">State</option>
                      <option value="local">Local</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Primary States (comma-separated state codes, e.g., CA, NY, TX)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.primary_states) ? formData.primary_states.join(', ') : (formData.primary_states || '')}
                      onChange={(e) => {
                        const states = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
                        setFormData({ ...formData, primary_states: states });
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="CA, NY, TX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 2-letter state codes separated by commas</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.rural_focus || false}
                        onChange={(e) => setFormData({ ...formData, rural_focus: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Rural Focus</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.urban_focus !== undefined ? formData.urban_focus : true}
                        onChange={(e) => setFormData({ ...formData, urban_focus: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Urban Focus</span>
                    </label>
                  </div>
                </div>

                {/* Target Sectors */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Target Sectors</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Target Sectors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.target_sectors) ? formData.target_sectors.join(', ') : (formData.target_sectors || '')}
                      onChange={(e) => {
                        const sectors = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setFormData({ ...formData, target_sectors: sectors });
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Healthcare, Education, Manufacturing"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter sectors separated by commas (e.g., Healthcare, Education, Manufacturing)</p>
                  </div>
                </div>

                {/* Deal Size Preferences */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Deal Size Preferences</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Deal Size ($)
                      </label>
                      <input
                        type="number"
                        value={formData.min_deal_size || ''}
                        onChange={(e) => setFormData({ ...formData, min_deal_size: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="1000000"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maximum Deal Size ($)
                      </label>
                      <input
                        type="number"
                        value={formData.max_deal_size || ''}
                        onChange={(e) => setFormData({ ...formData, max_deal_size: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="15000000"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.small_deal_fund || false}
                      onChange={(e) => setFormData({ ...formData, small_deal_fund: e.target.checked })}
                      className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-300">Small Deal Fund (accepts deals under $5M)</span>
                  </label>
                </div>

                {/* Deal Preferences */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Deal Preferences</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preferred Project Types (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.preferred_project_types) ? formData.preferred_project_types.join(', ') : (formData.preferred_project_types || '')}
                      onChange={(e) => {
                        const types = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setFormData({ ...formData, preferred_project_types: types });
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Real Estate, Business, Mixed-Use"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_severely_distressed || false}
                        onChange={(e) => setFormData({ ...formData, require_severely_distressed: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Require Severely Distressed Tracts</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.require_qct || false}
                        onChange={(e) => setFormData({ ...formData, require_qct: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-300">Require QCT (Qualified Census Tract)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* AUTOMATCH Preferences Section - Investor */}
            {orgType === 'investor' && (
              <div className="pt-6 border-t border-gray-800 space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100 mb-1">AutoMatch Preferences</h2>
                  <p className="text-sm text-gray-400">
                    Configure your investment criteria to help AutoMatch connect you with the right opportunities.
                  </p>
                </div>

                {/* Investment Criteria */}
                <div className="space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Investment Criteria</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Investment ($)
                      </label>
                      <input
                        type="number"
                        value={formData.min_investment || ''}
                        onChange={(e) => setFormData({ ...formData, min_investment: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="1000000"
                        min="0"
                        step="1000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Maximum Investment ($)
                      </label>
                      <input
                        type="number"
                        value={formData.max_investment || ''}
                        onChange={(e) => setFormData({ ...formData, max_investment: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="50000000"
                        min="0"
                        step="1000"
                      />
                    </div>
                  </div>
                </div>

                {/* Geographic Preferences */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Geographic Preferences</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preferred States (comma-separated state codes, e.g., CA, NY, TX)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.target_states) ? formData.target_states.join(', ') : (formData.target_states || formData.preferred_states || '')}
                      onChange={(e) => {
                        const states = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
                        setFormData({ ...formData, target_states: states, preferred_states: states });
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="CA, NY, TX"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter 2-letter state codes separated by commas</p>
                  </div>
                </div>

                {/* Preferred Sectors */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Preferred Sectors</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preferred Sectors (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.preferred_sectors) ? formData.preferred_sectors.join(', ') : (formData.preferred_sectors || '')}
                      onChange={(e) => {
                        const sectors = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                        setFormData({ ...formData, preferred_sectors: sectors });
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Healthcare, Education, Manufacturing"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter sectors separated by commas</p>
                  </div>
                </div>

                {/* Target Programs */}
                <div className="pt-4 border-t border-gray-800 space-y-4">
                  <h3 className="text-md font-semibold text-gray-100">Target Credit Programs</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Programs of Interest (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={Array.isArray(formData.target_credit_types) ? formData.target_credit_types.join(', ') : (formData.target_credit_types || formData.programs || '')}
                      onChange={(e) => {
                        const programs = e.target.value.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
                        setFormData({ ...formData, target_credit_types: programs, programs: programs });
                      }}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="NMTC, LIHTC, HTC, OZ"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter program codes: NMTC, LIHTC, HTC, OZ</p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-800 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  saving
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : saved
                    ? 'bg-green-600 text-white'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
