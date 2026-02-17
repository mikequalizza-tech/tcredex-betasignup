"use client";

import { useState } from "react";
import { IntakeData } from "../IntakeShell";
import { SectorCategory } from "@/types/intake";

interface ProjectBasicsProps {
  data: IntakeData;
  onChange: (updates: Partial<IntakeData>) => void;
  organizationName?: string;
}

// Legacy project types (kept for backward compatibility)
const _PROJECT_TYPES = [
  "Community Facility",
  "Healthcare",
  "Education",
  "Manufacturing",
  "Mixed-Use",
  "Office",
  "Retail",
  "Affordable Housing",
  "Historic Rehabilitation",
  "Industrial",
  "Other",
];

// Standardized sector categories for AutoMatch
const SECTOR_CATEGORIES: { value: SectorCategory; label: string }[] = [
  { value: "Healthcare/Medical", label: "Healthcare / Medical" },
  { value: "Education/Schools", label: "Education / Schools" },
  { value: "Housing/Residential", label: "Housing / Residential" },
  { value: "Industrial/Manufacturing", label: "Industrial / Manufacturing" },
  { value: "Retail/Commercial", label: "Retail / Commercial" },
  { value: "Food Access/Grocery", label: "Food Access / Grocery" },
  { value: "Childcare/Early Education", label: "Childcare / Early Education" },
  { value: "Senior Services", label: "Senior Services" },
  { value: "Community Facility", label: "Community Facility" },
  { value: "Mixed-Use", label: "Mixed-Use" },
  { value: "Other", label: "Other" },
];

export function ProjectBasics({
  data,
  onChange,
  organizationName,
}: ProjectBasicsProps) {
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // FIXED: Send only the changed field, not spreading data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateField = (field: keyof IntakeData, value: any) => {
    onChange({ [field]: value });
  };

  // Filter out images with empty/invalid URLs (leftover from base64 stripping)
  const validImages = (data.projectImages || []).filter(
    (img) => img.url && img.url.startsWith("http"),
  );

  // Handle image upload — uploads to Supabase storage, stores permanent URL
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    setUploadError(null);

    const newImages: {
      id: string;
      name: string;
      url: string;
      size: number;
      type: string;
    }[] = [];

    for (let i = 0; i < Math.min(files.length, 5 - validImages.length); i++) {
      const file = files[i];

      // Client-side size check (25MB limit)
      if (file.size > 25 * 1024 * 1024) {
        setUploadError(`${file.name} exceeds 25MB limit`);
        continue;
      }

      // Upload to Supabase storage via deal-media endpoint
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/deal-media", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        if (res.ok) {
          const result = await res.json();
          newImages.push({
            id: `img_${Date.now()}_${i}`,
            name: file.name,
            url: result.url, // Permanent Supabase public URL
            size: file.size,
            type: file.type,
          });
        } else {
          const errData = await res.json().catch(() => ({}));
          console.error(
            "[ProjectBasics] Image upload failed:",
            res.status,
            errData,
          );
          setUploadError(errData.error || `Upload failed (${res.status})`);
        }
      } catch (err) {
        console.error("[ProjectBasics] Image upload error:", err);
        setUploadError("Network error during upload");
      }
    }

    if (newImages.length > 0) {
      // Replace projectImages with only valid images + new uploads (drops dead base64 refs)
      onChange({ projectImages: [...validImages, ...newImages] });
    }
    setUploadingImages(false);
  };

  const removeImage = (index: number) => {
    const images = [...validImages];
    images.splice(index, 1);
    onChange({ projectImages: images });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={data.projectName || ""}
          onChange={(e) => updateField("projectName", e.target.value)}
          placeholder="e.g., Downtown Community Center"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Sector Category - Primary for AutoMatch */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Sector <span className="text-red-400">*</span>
          <span className="text-indigo-400 text-xs ml-2">
            (Used for CDE matching)
          </span>
        </label>
        <select
          value={data.sectorCategory || ""}
          onChange={(e) => {
            const value = e.target.value as SectorCategory;
            onChange({ sectorCategory: value, projectType: value });
          }}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option value="">Select project sector...</option>
          {SECTOR_CATEGORIES.map((sector) => (
            <option key={sector.value} value={sector.value}>
              {sector.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-2">
          CDEs often focus on specific sectors. Accurate selection improves
          matching quality.
        </p>
      </div>

      {/* Legacy Project Type - Hidden but kept for compatibility */}
      <input type="hidden" value={data.projectType || ""} />

      {/* NMTC Financing Type - Critical for CDE matching */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Financing Type <span className="text-red-400">*</span>
          <span className="text-indigo-400 text-xs ml-2">
            (NMTC - Critical for CDE matching)
          </span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onChange({ ventureType: "Real Estate" })}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              data.ventureType === "Real Estate"
                ? "border-indigo-500 bg-indigo-900/30"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="font-medium text-gray-200">Real Estate</div>
            <p className="text-xs text-gray-500 mt-1">
              Construction, renovation, or acquisition of property
            </p>
          </button>
          <button
            type="button"
            onClick={() => onChange({ ventureType: "Business" })}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              data.ventureType === "Business"
                ? "border-indigo-500 bg-indigo-900/30"
                : "border-gray-700 hover:border-gray-600"
            }`}
          >
            <div className="font-medium text-gray-200">Business</div>
            <p className="text-xs text-gray-500 mt-1">
              Equipment, working capital, or operating business
            </p>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          CDEs specialize in Real Estate or Business financing. Select the
          primary focus of your project.
        </p>
      </div>

      {/* Owner-Occupied - NMTC specific */}
      <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isOwnerOccupied === true}
            onChange={(e) => onChange({ isOwnerOccupied: e.target.checked })}
            className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-300">
              Owner-Occupied Transaction
            </span>
            <p className="text-xs text-gray-500">
              Sponsor will occupy or operate the facility.
              {data.isOwnerOccupied && (
                <span className="text-indigo-400 ml-1">
                  This project matches both Real Estate AND Business CDEs.
                </span>
              )}
            </p>
          </div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Project Description
        </label>
        <textarea
          value={data.projectDescription || ""}
          onChange={(e) => updateField("projectDescription", e.target.value)}
          placeholder="Brief description of the project, its purpose, and what it will accomplish..."
          rows={4}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          This will appear on your marketplace listing
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Community Impact{" "}
          <span className="text-indigo-400 text-xs ml-2">
            Helps with matching
          </span>
        </label>
        <textarea
          value={data.communityImpact || ""}
          onChange={(e) => updateField("communityImpact", e.target.value)}
          placeholder="Describe how this project will benefit the community:&#10;• Jobs created (construction and permanent)&#10;• Services provided to residents&#10;• Economic development impact&#10;• Environmental or health benefits&#10;• Underserved populations served"
          rows={5}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <p className="text-xs text-gray-500 mt-1">
          Strong community impact statements improve CDE matching and investor
          interest
        </p>
      </div>

      {/* Project Images Section */}
      <div className="border-t border-gray-800 pt-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Project Images{" "}
          <span className="text-gray-500 text-xs ml-2">(up to 5 images)</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload photos of the site, renderings, or related project images for
          your Project Profile
        </p>

        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
          <input
            type="file"
            id="projectImages"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            disabled={uploadingImages || validImages.length >= 5}
            className="hidden"
          />
          <label
            htmlFor="projectImages"
            className={`cursor-pointer ${validImages.length >= 5 ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <svg
              className="w-10 h-10 mx-auto text-gray-500 mb-3"
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
            {uploadingImages ? (
              <p className="text-gray-400">Uploading...</p>
            ) : validImages.length >= 5 ? (
              <p className="text-gray-500">Maximum 5 images reached</p>
            ) : (
              <>
                <p className="text-indigo-400 font-medium">
                  Click to upload images
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PNG, JPG, or WEBP up to 25MB each
                </p>
              </>
            )}
          </label>

          {uploadError && (
            <p className="text-red-400 text-xs mt-2">{uploadError}</p>
          )}
        </div>

        {validImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            {validImages.map((image, index) => (
              <div
                key={image.id || `${image.name}-${index}`}
                className="relative group"
              >
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                  {image.url ? (
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
                      Image not loaded
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg
                    className="w-4 h-4 text-white"
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
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {image.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sponsor Information */}
      <div className="border-t border-gray-800 pt-6">
        <h3 className="text-sm font-semibold text-gray-300 mb-4">
          Sponsor Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Organization Name
            </label>
            <div className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-100">
              {organizationName || data.sponsorName || (
                <span className="text-gray-500">Not available</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From your organization profile
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contact Email
            </label>
            <input
              type="email"
              value={data.sponsorEmail || ""}
              onChange={(e) => updateField("sponsorEmail", e.target.value)}
              placeholder="contact@example.com"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Contact Phone
            </label>
            <input
              type="tel"
              value={data.sponsorPhone || ""}
              onChange={(e) => updateField("sponsorPhone", e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectBasics;
