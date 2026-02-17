"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useCurrentUser } from "@/lib/auth";

type MemberRole = "owner" | "admin" | "member" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  title: string;
  role: MemberRole;
  avatar?: string;
  lastActive: string;
  status: "active" | "pending" | "inactive";
  phone?: string;
  department?: string;
}

const ROLE_LABELS: Record<MemberRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<MemberRole, string> = {
  owner: "bg-purple-900/50 text-purple-300",
  admin: "bg-blue-900/50 text-blue-300",
  member: "bg-green-900/50 text-green-300",
  viewer: "bg-gray-700 text-gray-300",
};

const STATUS_COLORS = {
  active: "bg-green-500",
  pending: "bg-amber-500",
  inactive: "bg-gray-500",
};

export default function TeamPage() {
  const {
    userName,
    userEmail,
    orgName,
    orgType,
    organizationId,
    canEditOrganization,
    isOrgAdmin,
  } = useCurrentUser();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Map API roles to frontend roles
  const mapApiRoleToFrontend = (apiRole: string): MemberRole => {
    const roleMap: Record<string, MemberRole> = {
      ORG_ADMIN: "admin",
      PROJECT_ADMIN: "admin",
      MEMBER: "member",
      VIEWER: "viewer",
    };
    return roleMap[apiRole] || "member";
  };

  // Fetch team members from API
  const fetchTeamMembers = useCallback(async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const data = await response.json();
        // Transform API response to match frontend format
        const transformedMembers: TeamMember[] = (data.members || []).map(
          (m: {
            id: string;
            name: string;
            email: string;
            role: string;
            title?: string;
            avatar_url?: string;
            is_active?: boolean;
            last_login_at?: string;
          }) => ({
            id: m.id,
            name: m.name || m.email.split("@")[0],
            email: m.email,
            title: m.title || "Team Member",
            role: mapApiRoleToFrontend(m.role),
            avatar: m.avatar_url,
            lastActive: m.last_login_at
              ? new Date(m.last_login_at).toLocaleDateString()
              : "Never",
            status: m.is_active ? "active" : "inactive",
          }),
        );

        // If no members returned, show current user
        if (transformedMembers.length === 0) {
          transformedMembers.push({
            id: "current-user",
            name: userName || "You",
            email: userEmail || "",
            title: "Organization Owner",
            role: "owner",
            lastActive: "Now",
            status: "active",
          });
        }
        setMembers(transformedMembers);
      } else {
        // If API fails or no members, show current user as the only member (owner)
        setMembers([
          {
            id: "current-user",
            name: userName || "You",
            email: userEmail || "",
            title: "Organization Owner",
            role: "owner",
            lastActive: "Now",
            status: "active",
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch team members:", error);
      // Show current user as owner on error
      setMembers([
        {
          id: "current-user",
          name: userName || "You",
          email: userEmail || "",
          title: "Organization Owner",
          role: "owner",
          lastActive: "Now",
          status: "active",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, userName, userEmail]);

  // Fetch on mount
  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showOrgSettingsModal, setShowOrgSettingsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<MemberRole | "all">("all");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<MemberRole>("member");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{
    email: string;
    name: string;
    emailSent: boolean;
    error?: string;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Organization settings state
  const [organizationName, setOrganizationName] = useState(
    orgName || "My Organization",
  );
  const [orgSettingsSaving, setOrgSettingsSaving] = useState(false);

  // About Organization state
  const [orgDescription, setOrgDescription] = useState("");
  const [orgWebsite, setOrgWebsite] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");
  const [orgCity, setOrgCity] = useState("");
  const [orgState, setOrgState] = useState("");
  const [orgZip, setOrgZip] = useState("");
  const [orgYearFounded, setOrgYearFounded] = useState("");
  const [orgPrimaryContact, setOrgPrimaryContact] = useState("");
  const [orgPrimaryEmail, setOrgPrimaryEmail] = useState("");
  const [showAboutSection, setShowAboutSection] = useState(true);
  const [aboutSaving, setAboutSaving] = useState(false);
  const [orgLogoUrl, setOrgLogoUrl] = useState("");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoDragActive, setLogoDragActive] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Sponsor-specific fields (ownership certifications)
  const [orgEntityType, setOrgEntityType] = useState("");
  const [lowIncomeOwned, setLowIncomeOwned] = useState(false);
  const [womanOwned, setWomanOwned] = useState(false);
  const [minorityOwned, setMinorityOwned] = useState(false);
  const [veteranOwned, setVeteranOwned] = useState(false);

  // Load organization details
  useEffect(() => {
    const loadOrgDetails = async () => {
      if (!organizationId) return;
      try {
        const response = await fetch(`/api/organization?id=${organizationId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.organization) {
            setOrganizationName(data.organization.name || orgName || "");
            setOrgDescription(data.organization.description || "");
            setOrgWebsite(data.organization.website || "");
            setOrgPhone(data.organization.primary_contact_phone || "");
            setOrgAddress(data.organization.address || "");
            setOrgCity(data.organization.city || "");
            setOrgState(data.organization.state || "");
            setOrgZip(data.organization.zip_code || "");
            setOrgYearFounded(data.organization.year_founded || "");
            setOrgPrimaryContact(data.organization.primary_contact_name || "");
            setOrgPrimaryEmail(data.organization.primary_contact_email || "");
            // Logo
            setOrgLogoUrl(data.organization.logo_url || "");
            // Sponsor-specific fields
            setOrgEntityType(data.organization.organization_type || "");
            setLowIncomeOwned(data.organization.low_income_owned || false);
            setWomanOwned(data.organization.woman_owned || false);
            setMinorityOwned(data.organization.minority_owned || false);
            setVeteranOwned(data.organization.veteran_owned || false);
          }
        }
      } catch (error) {
        console.error("Failed to load organization details:", error);
      }
    };
    loadOrgDetails();
  }, [organizationId, orgName]);

  // Save organization about info
  const handleSaveAbout = async () => {
    if (!organizationId) return;
    setAboutSaving(true);
    try {
      const response = await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: organizationId,
          name: organizationName,
          description: orgDescription,
          website: orgWebsite,
          phone: orgPhone,
          address_line1: orgAddress,
          city: orgCity,
          state: orgState,
          zip_code: orgZip,
          year_founded: orgYearFounded,
          primary_contact_name: orgPrimaryContact,
          primary_contact_email: orgPrimaryEmail,
          logo_url: orgLogoUrl || null,
          // Sponsor-specific fields
          organization_type: orgEntityType,
          low_income_owned: lowIncomeOwned,
          woman_owned: womanOwned,
          minority_owned: minorityOwned,
          veteran_owned: veteranOwned,
        }),
      });
      if (response.ok) {
        alert("Organization profile saved!");
        // Reload to refresh user context (useCurrentUser reads organization_name on mount)
        window.location.reload();
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      console.error("Failed to save organization:", error);
      alert("Failed to save organization profile");
    } finally {
      setAboutSaving(false);
    }
  };

  // Logo upload handler
  const handleLogoFile = async (file: File) => {
    setLogoError(null);
    if (!file.type.startsWith("image/")) {
      setLogoError("Please upload an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("File size must be less than 5MB");
      return;
    }
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload/org-logo", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Upload failed");
      }
      const { url } = await response.json();
      setOrgLogoUrl(url);
      // Auto-save logo_url to DB
      if (organizationId) {
        await fetch("/api/organization", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: organizationId, logo_url: url }),
        });
      }
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoRemove = async () => {
    setOrgLogoUrl("");
    if (organizationId) {
      await fetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: organizationId, logo_url: null }),
      });
    }
  };

  // Access control - only ORG_ADMIN can edit organization settings
  const canEditOrg =
    typeof canEditOrganization === "function"
      ? canEditOrganization()
      : isOrgAdmin;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      alert("Please enter an email address");
      return;
    }

    setInviteSending(true);
    try {
      // Map frontend roles to API roles
      const apiRoleMap: Record<MemberRole, string> = {
        owner: "ORG_ADMIN",
        admin: "ORG_ADMIN",
        member: "MEMBER",
        viewer: "VIEWER",
      };

      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: apiRoleMap[inviteRole] || "MEMBER",
          name: inviteEmail
            .split("@")[0]
            .replace(/[._]/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add to local state with proper format
        const newMember: TeamMember = {
          id: data.user?.id || `user-${Date.now()}`,
          name:
            data.user?.name ||
            inviteEmail
              .split("@")[0]
              .replace(/[._]/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase()),
          email: inviteEmail,
          title: "Invited Member",
          role: inviteRole,
          lastActive: "Pending",
          status: "pending",
        };
        setMembers((prev) => [...prev, newMember]);
        setShowInviteModal(false);
        setInviteSuccess({
          email: inviteEmail,
          name: newMember.name,
          emailSent: data.emailSent,
          error: data.emailSent
            ? undefined
            : data.message || "Check Resend domain verification and API key.",
        });
        setInviteEmail("");
        setInviteRole("member");
        setInviteMessage("");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to send invitation");
      }
    } catch (error) {
      console.error("Failed to send invitation:", error);
      alert("Failed to send invitation. Please try again.");
    } finally {
      setInviteSending(false);
    }
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setEditMode(false);
    setShowMemberModal(true);
    setOpenMenuId(null);
  };

  const handleEditMember = (member: TeamMember) => {
    setSelectedMember(member);
    setEditMode(true);
    setShowMemberModal(true);
    setOpenMenuId(null);
  };

  const handleSaveMember = () => {
    if (selectedMember) {
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? selectedMember : m)),
      );
      setShowMemberModal(false);
      setSelectedMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    setOpenMenuId(null);

    try {
      const response = await fetch("/api/team", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      if (response.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        const data = await response.json();
        alert(data.error || "Failed to remove team member");
      }
    } catch (error) {
      console.error("Failed to remove member:", error);
      alert("Failed to remove team member. Please try again.");
    }
  };

  const handleResendInvite = (member: TeamMember) => {
    alert(`Invitation resent to ${member.email}`);
    setOpenMenuId(null);
  };

  const filteredMembers = members.filter((member) => {
    if (roleFilter !== "all" && member.role !== roleFilter) return false;
    if (
      searchQuery &&
      !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !member.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false;
    return true;
  });

  const stats = {
    total: members.length,
    active: members.filter((m) => m.status === "active").length,
    pending: members.filter((m) => m.status === "pending").length,
    admins: members.filter((m) => m.role === "admin" || m.role === "owner")
      .length,
  };

  // Show loading state
  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-100">Organization</h1>
          <p className="text-gray-400 mt-1">
            Manage your organization profile and team members
          </p>
        </div>
        {isOrgAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-500 transition-colors"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
            Invite Member
          </button>
        )}
      </div>

      {/* Organization Settings Card */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {orgLogoUrl ? (
              <div className="w-14 h-14 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden relative flex-shrink-0">
                <Image
                  src={orgLogoUrl}
                  alt={organizationName}
                  fill
                  className="object-contain p-1"
                />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-xl bg-indigo-600/20 border border-indigo-600/30 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-7 h-7 text-indigo-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold text-gray-100">
                  {organizationName}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    orgType === "sponsor"
                      ? "bg-green-900/50 text-green-400"
                      : orgType === "cde"
                        ? "bg-purple-900/50 text-purple-400"
                        : "bg-blue-900/50 text-blue-400"
                  }`}
                >
                  {orgType === "sponsor"
                    ? "Sponsor"
                    : orgType === "cde"
                      ? "CDE"
                      : "Investor"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                Organization ID: ORG-{Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>
          {canEditOrg && (
            <button
              onClick={() => setShowOrgSettingsModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Organization Settings
            </button>
          )}
        </div>
        {!canEditOrg && (
          <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Only Owners and Admins can edit organization settings
          </p>
        )}
      </div>

      {/* About Organization Section */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8 overflow-hidden">
        <button
          onClick={() => setShowAboutSection(!showAboutSection)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-800/50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 border border-purple-600/30 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">
                About Your Organization
              </h3>
              <p className="text-sm text-gray-500">
                Profile info used in deal exports and Project Profiles
              </p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${showAboutSection ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {showAboutSection && (
          <div className="p-6 pt-2 border-t border-gray-800">
            {/* Organization Logo Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Organization Logo
              </label>
              <div className="flex items-start gap-4">
                {orgLogoUrl ? (
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-xl bg-gray-800 border border-gray-700 overflow-hidden relative">
                      <Image
                        src={orgLogoUrl}
                        alt="Organization logo"
                        fill
                        className="object-contain p-1"
                      />
                    </div>
                    {canEditOrg && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded transition-colors"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                ) : canEditOrg ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setLogoDragActive(true);
                    }}
                    onDragLeave={() => setLogoDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setLogoDragActive(false);
                      if (e.dataTransfer.files?.[0])
                        handleLogoFile(e.dataTransfer.files[0]);
                    }}
                    onClick={() => logoInputRef.current?.click()}
                    className={`w-24 h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors ${
                      logoDragActive
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800"
                    }`}
                  >
                    {logoUploading ? (
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg
                          className="w-8 h-8 text-gray-500 mb-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-[10px] text-gray-500">
                          Upload
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
                    <svg
                      className="w-8 h-8 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="text-sm text-gray-400 pt-1">
                  <p>
                    Your logo appears on deal exports, CDE profile pages, and
                    Project Profiles.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, or WebP. Max 5MB.
                  </p>
                  {logoError && (
                    <p className="text-xs text-red-400 mt-1">{logoError}</p>
                  )}
                </div>
              </div>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                aria-label="Upload organization logo"
                onChange={(e) => {
                  if (e.target.files?.[0]) handleLogoFile(e.target.files[0]);
                }}
                className="hidden"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) =>
                      canEditOrg && setOrganizationName(e.target.value)
                    }
                    placeholder="Your organization name"
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                  {!canEditOrg && (
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Only Organization Admins can change the organization name
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    About / Description
                  </label>
                  <textarea
                    value={orgDescription}
                    onChange={(e) =>
                      canEditOrg && setOrgDescription(e.target.value)
                    }
                    placeholder="Brief description of your organization, mission, and experience..."
                    rows={4}
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will appear on your Project Profile exports
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={orgWebsite}
                    onChange={(e) =>
                      canEditOrg && setOrgWebsite(e.target.value)
                    }
                    placeholder="https://www.example.com"
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Year Founded
                  </label>
                  <input
                    type="text"
                    value={orgYearFounded}
                    onChange={(e) =>
                      canEditOrg && setOrgYearFounded(e.target.value)
                    }
                    placeholder="2010"
                    maxLength={4}
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Primary Contact Name
                  </label>
                  <input
                    type="text"
                    value={orgPrimaryContact}
                    onChange={(e) =>
                      canEditOrg && setOrgPrimaryContact(e.target.value)
                    }
                    placeholder="John Smith"
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Primary Contact Email
                  </label>
                  <input
                    type="email"
                    value={orgPrimaryEmail}
                    onChange={(e) =>
                      canEditOrg && setOrgPrimaryEmail(e.target.value)
                    }
                    placeholder="contact@example.com"
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={orgPhone}
                    onChange={(e) => canEditOrg && setOrgPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    value={orgAddress}
                    onChange={(e) =>
                      canEditOrg && setOrgAddress(e.target.value)
                    }
                    placeholder="123 Main Street"
                    readOnly={!canEditOrg}
                    className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      canEditOrg
                        ? "bg-gray-800 border-gray-700"
                        : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                    }`}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={orgCity}
                      onChange={(e) => canEditOrg && setOrgCity(e.target.value)}
                      placeholder="City"
                      readOnly={!canEditOrg}
                      className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        canEditOrg
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={orgState}
                      onChange={(e) =>
                        canEditOrg && setOrgState(e.target.value)
                      }
                      placeholder="ST"
                      maxLength={2}
                      readOnly={!canEditOrg}
                      className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        canEditOrg
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      ZIP
                    </label>
                    <input
                      type="text"
                      value={orgZip}
                      onChange={(e) => canEditOrg && setOrgZip(e.target.value)}
                      placeholder="12345"
                      maxLength={10}
                      readOnly={!canEditOrg}
                      className={`w-full px-3 py-2 border rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                        canEditOrg
                          ? "bg-gray-800 border-gray-700"
                          : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sponsor-Specific: Entity Type & Ownership Certifications */}
            {orgType === "sponsor" && (
              <div className="pt-6 border-t border-gray-800">
                <h3 className="text-md font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Organization Certifications
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  These certifications will auto-populate in deal intake forms.
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Entity Type */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Entity Type
                      </label>
                      <select
                        value={orgEntityType}
                        onChange={(e) =>
                          canEditOrg && setOrgEntityType(e.target.value)
                        }
                        disabled={!canEditOrg}
                        className={`w-full px-3 py-2 border rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          canEditOrg
                            ? "bg-gray-800 border-gray-700"
                            : "bg-gray-800/50 border-gray-700/50 cursor-not-allowed"
                        }`}
                      >
                        <option value="">Select entity type...</option>
                        <option value="for-profit">
                          For-Profit Corporation
                        </option>
                        <option value="non-profit">
                          Non-Profit Organization
                        </option>
                        <option value="llc">
                          Limited Liability Company (LLC)
                        </option>
                        <option value="partnership">Partnership</option>
                        <option value="government">Government Entity</option>
                        <option value="tribal">Tribal Entity</option>
                      </select>
                    </div>
                  </div>

                  {/* Right Column - Ownership Certifications */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={lowIncomeOwned}
                        onChange={(e) =>
                          canEditOrg && setLowIncomeOwned(e.target.checked)
                        }
                        disabled={!canEditOrg}
                        className="w-5 h-5 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300 group-hover:text-white">
                          Low-Income Community Representation
                        </span>
                        <p className="text-xs text-gray-500">
                          &gt;50% board/ownership from LIC
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={womanOwned}
                        onChange={(e) =>
                          canEditOrg && setWomanOwned(e.target.checked)
                        }
                        disabled={!canEditOrg}
                        className="w-5 h-5 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300 group-hover:text-white">
                          Woman-Owned
                        </span>
                        <p className="text-xs text-gray-500">
                          &gt;51% woman ownership
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={minorityOwned}
                        onChange={(e) =>
                          canEditOrg && setMinorityOwned(e.target.checked)
                        }
                        disabled={!canEditOrg}
                        className="w-5 h-5 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300 group-hover:text-white">
                          Minority-Owned
                        </span>
                        <p className="text-xs text-gray-500">
                          &gt;51% minority ownership
                        </p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={veteranOwned}
                        onChange={(e) =>
                          canEditOrg && setVeteranOwned(e.target.checked)
                        }
                        disabled={!canEditOrg}
                        className="w-5 h-5 text-indigo-600 bg-gray-800 border-gray-700 rounded focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-sm text-gray-300 group-hover:text-white">
                          Veteran-Owned
                        </span>
                        <p className="text-xs text-gray-500">
                          &gt;51% veteran ownership
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button - Only show for admins */}
            {canEditOrg && (
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveAbout}
                  disabled={aboutSaving || !organizationName.trim()}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed font-medium transition-colors"
                >
                  {aboutSaving ? "Saving..." : "Save Organization Profile"}
                </button>
              </div>
            )}
            {!canEditOrg && (
              <div className="mt-6 p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-sm text-gray-400 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Contact your Organization Admin to update these settings
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-gray-100">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Members</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">
            {stats.active}
          </div>
          <div className="text-sm text-gray-500">Active</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-amber-400">
            {stats.pending}
          </div>
          <div className="text-sm text-gray-500">Pending Invites</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <div className="text-2xl font-bold text-purple-400">
            {stats.admins}
          </div>
          <div className="text-sm text-gray-500">Admins</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as MemberRole | "all")
            }
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Team Members */}
      <div className="bg-gray-900 rounded-xl border border-gray-800">
        <div className="divide-y divide-gray-800">
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              className="p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
              onClick={() => handleMemberClick(member)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-lg font-medium text-gray-300 border border-gray-700">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900 ${STATUS_COLORS[member.status]}`}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-100">
                        {member.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[member.role]}`}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">{member.email}</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {member.title}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-sm text-gray-500 hidden md:block">
                    {member.status === "pending"
                      ? "Invitation sent"
                      : `Active ${member.lastActive}`}
                  </div>

                  {/* Dropdown Menu */}
                  <div
                    className="relative"
                    ref={openMenuId === member.id ? menuRef : null}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === member.id ? null : member.id,
                        );
                      }}
                      className="text-gray-500 hover:text-gray-300 p-2 hover:bg-gray-700 rounded-lg transition-colors"
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
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>

                    {openMenuId === member.id && (
                      <div className="absolute right-0 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleMemberClick(member)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            View Profile
                          </button>
                          {isOrgAdmin && (
                            <>
                              <button
                                onClick={() => handleEditMember(member)}
                                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center gap-2"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Edit Member
                              </button>
                              {member.status === "pending" && (
                                <button
                                  onClick={() => handleResendInvite(member)}
                                  className="w-full px-4 py-2 text-left text-sm text-amber-400 hover:bg-gray-700 flex items-center gap-2"
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
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                  Resend Invite
                                </button>
                              )}
                              <hr className="border-gray-700 my-1" />
                              <button
                                onClick={() => handleRemoveMember(member.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Remove Member
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredMembers.length === 0 && (
          <div className="p-8 text-center">
            <svg
              className="w-12 h-12 text-gray-600 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-gray-400">
              No team members found matching your filters.
            </p>
          </div>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="mt-6 bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h3 className="font-semibold text-gray-100 mb-4">Role Permissions</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-900/20 border border-purple-500/20 rounded-lg">
            <div className="font-medium text-purple-300">Owner</div>
            <ul className="text-sm text-purple-400/80 mt-2 space-y-1">
              <li>• Full access</li>
              <li>• Billing management</li>
              <li>• Delete organization</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
            <div className="font-medium text-blue-300">Admin</div>
            <ul className="text-sm text-blue-400/80 mt-2 space-y-1">
              <li>• Manage team</li>
              <li>• All deal operations</li>
              <li>• View analytics</li>
            </ul>
          </div>
          <div className="p-4 bg-green-900/20 border border-green-500/20 rounded-lg">
            <div className="font-medium text-green-300">Member</div>
            <ul className="text-sm text-green-400/80 mt-2 space-y-1">
              <li>• Create/edit deals</li>
              <li>• Upload documents</li>
              <li>• View pipeline</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-800 border border-gray-700 rounded-lg">
            <div className="font-medium text-gray-300">Viewer</div>
            <ul className="text-sm text-gray-400 mt-2 space-y-1">
              <li>• View deals</li>
              <li>• View documents</li>
              <li>• Read-only access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Member Detail/Edit Modal */}
      {showMemberModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowMemberModal(false)}
          />
          <div className="relative bg-gray-900 rounded-xl w-full max-w-lg mx-4 shadow-xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-100">
                  {editMode ? "Edit Team Member" : "Team Member"}
                </h3>
                <button
                  onClick={() => setShowMemberModal(false)}
                  className="text-gray-500 hover:text-white"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-2xl font-medium text-gray-300 border border-gray-700">
                  {selectedMember.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-medium text-gray-100">
                      {selectedMember.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[selectedMember.role]}`}
                    >
                      {ROLE_LABELS[selectedMember.role]}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    {selectedMember.title}
                  </div>
                </div>
              </div>

              {editMode ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={selectedMember.name}
                      onChange={(e) =>
                        setSelectedMember({
                          ...selectedMember,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={selectedMember.title}
                      onChange={(e) =>
                        setSelectedMember({
                          ...selectedMember,
                          title: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={selectedMember.email}
                      onChange={(e) =>
                        setSelectedMember({
                          ...selectedMember,
                          email: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={selectedMember.phone || ""}
                      onChange={(e) =>
                        setSelectedMember({
                          ...selectedMember,
                          phone: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={selectedMember.department || ""}
                      onChange={(e) =>
                        setSelectedMember({
                          ...selectedMember,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Role
                    </label>
                    <select
                      value={selectedMember.role}
                      onChange={(e) =>
                        setSelectedMember({
                          ...selectedMember,
                          role: e.target.value as MemberRole,
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-500">Email</span>
                    <span className="text-gray-200">
                      {selectedMember.email}
                    </span>
                  </div>
                  {selectedMember.phone && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-500">Phone</span>
                      <span className="text-gray-200">
                        {selectedMember.phone}
                      </span>
                    </div>
                  )}
                  {selectedMember.department && (
                    <div className="flex justify-between py-2 border-b border-gray-800">
                      <span className="text-gray-500">Department</span>
                      <span className="text-gray-200">
                        {selectedMember.department}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-b border-gray-800">
                    <span className="text-gray-500">Status</span>
                    <span
                      className={`capitalize ${selectedMember.status === "active" ? "text-green-400" : selectedMember.status === "pending" ? "text-amber-400" : "text-gray-400"}`}
                    >
                      {selectedMember.status}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-500">Last Active</span>
                    <span className="text-gray-200">
                      {selectedMember.lastActive}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={() => setEditMode(false)}
                    className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMember}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowMemberModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                  >
                    Edit
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowInviteModal(false)}
          />
          <div className="relative bg-gray-900 rounded-xl p-6 w-full max-w-md mx-4 shadow-xl border border-gray-800">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              Invite Team Member
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@example.com"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as MemberRole)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Personal Message (Optional)
                </label>
                <textarea
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal note..."
                  rows={3}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSendInvite}
                disabled={inviteSending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800"
              >
                {inviteSending ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Success Modal */}
      {inviteSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setInviteSuccess(null)}
          />
          <div className="relative bg-gray-900 rounded-xl w-full max-w-md mx-4 shadow-xl border border-gray-800 p-8 text-center">
            <div
              className={`w-16 h-16 ${inviteSuccess.emailSent ? "bg-green-900/30 border-green-500/30" : "bg-amber-900/30 border-amber-500/30"} border rounded-full flex items-center justify-center mx-auto mb-4`}
            >
              {inviteSuccess.emailSent ? (
                <svg
                  className="w-8 h-8 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-8 h-8 text-amber-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {inviteSuccess.emailSent ? "Team Invite Sent!" : "Member Added"}
            </h3>
            <p className="text-gray-400 mb-1">
              {inviteSuccess.emailSent ? (
                <>
                  Invitation email delivered to{" "}
                  <span className="text-white font-medium">
                    {inviteSuccess.name}
                  </span>
                </>
              ) : (
                <>
                  Account created for{" "}
                  <span className="text-white font-medium">
                    {inviteSuccess.name}
                  </span>
                </>
              )}
            </p>
            <p className="text-sm text-gray-500">
              Sent to: {inviteSuccess.email}
            </p>
            {!inviteSuccess.emailSent && inviteSuccess.error && (
              <p className="text-sm text-amber-400 mt-3">
                {inviteSuccess.error}
              </p>
            )}
            <button
              type="button"
              onClick={() => setInviteSuccess(null)}
              className="mt-6 px-6 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Organization Settings Modal */}
      {showOrgSettingsModal && canEditOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowOrgSettingsModal(false)}
          />
          <div className="relative bg-gray-900 rounded-xl w-full max-w-lg mx-4 shadow-xl border border-gray-800 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100">
                    Organization Settings
                  </h3>
                </div>
                <button
                  onClick={() => setShowOrgSettingsModal(false)}
                  className="text-gray-500 hover:text-white"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This name will be visible to other users on the platform
                </p>
              </div>

              {/* Organization Type - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Organization Type
                </label>
                <div className="px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      orgType === "sponsor"
                        ? "bg-green-900/50 text-green-400"
                        : orgType === "cde"
                          ? "bg-purple-900/50 text-purple-400"
                          : "bg-blue-900/50 text-blue-400"
                    }`}
                  >
                    {orgType === "sponsor"
                      ? "Project Sponsor"
                      : orgType === "cde"
                        ? "Community Development Entity"
                        : "Investor"}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Contact support to change your organization type
                </p>
              </div>

              {/* Danger Zone */}
              <div className="pt-4 border-t border-gray-800">
                <h4 className="text-sm font-medium text-red-400 mb-3">
                  Danger Zone
                </h4>
                <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Delete Organization
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Permanently delete this organization and all associated
                        data
                      </p>
                    </div>
                    <button className="px-3 py-1.5 text-sm text-red-400 border border-red-800 rounded hover:bg-red-900/20 transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={() => setShowOrgSettingsModal(false)}
                className="flex-1 px-4 py-2 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!organizationId) return;
                  setOrgSettingsSaving(true);
                  try {
                    const response = await fetch("/api/organization", {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        id: organizationId,
                        name: organizationName,
                      }),
                    });
                    if (response.ok) {
                      setShowOrgSettingsModal(false);
                      alert("Organization settings saved!");
                    } else {
                      const errorData = await response.json();
                      alert(errorData.error || "Failed to save settings");
                    }
                  } catch (error) {
                    console.error(
                      "Failed to save organization settings:",
                      error,
                    );
                    alert("Failed to save settings. Please try again.");
                  } finally {
                    setOrgSettingsSaving(false);
                  }
                }}
                disabled={orgSettingsSaving || !organizationName.trim()}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed"
              >
                {orgSettingsSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
