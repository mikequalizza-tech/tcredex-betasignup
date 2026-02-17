import { describe, it, expect } from "vitest";
import {
  isLikelyImageUrl,
  deriveImageNameFromUrl,
  buildImageId,
  normalizeProjectImage,
  normalizeProjectImages,
} from "../project-images";

// =============================================================================
// isLikelyImageUrl
// =============================================================================

describe("isLikelyImageUrl", () => {
  it("accepts https URLs", () => {
    expect(isLikelyImageUrl("https://example.com/image.png")).toBe(true);
  });

  it("accepts http URLs", () => {
    expect(isLikelyImageUrl("http://example.com/image.jpg")).toBe(true);
  });

  it("accepts data URIs", () => {
    expect(isLikelyImageUrl("data:image/png;base64,abc123")).toBe(true);
  });

  it("accepts blob URLs", () => {
    expect(isLikelyImageUrl("blob:http://localhost:3000/abc")).toBe(true);
  });

  it("rejects plain strings", () => {
    expect(isLikelyImageUrl("hello world")).toBe(false);
    expect(isLikelyImageUrl("image.png")).toBe(false);
  });

  it("rejects empty strings", () => {
    expect(isLikelyImageUrl("")).toBe(false);
  });

  it("rejects file paths", () => {
    expect(isLikelyImageUrl("/path/to/image.png")).toBe(false);
    expect(isLikelyImageUrl("C:\\images\\photo.jpg")).toBe(false);
  });
});

// =============================================================================
// deriveImageNameFromUrl
// =============================================================================

describe("deriveImageNameFromUrl", () => {
  it("extracts filename from URL", () => {
    expect(
      deriveImageNameFromUrl("https://example.com/photos/sunset.jpg"),
    ).toBe("sunset.jpg");
  });

  it("strips query params", () => {
    expect(deriveImageNameFromUrl("https://example.com/photo.png?w=800")).toBe(
      "photo.png",
    );
  });

  it("decodes URI-encoded characters", () => {
    expect(deriveImageNameFromUrl("https://example.com/my%20photo.jpg")).toBe(
      "my photo.jpg",
    );
  });

  it("falls back to indexed name when no segment found", () => {
    expect(deriveImageNameFromUrl("", 2)).toBe("image-3.jpg");
  });

  it("defaults fallback index to 0", () => {
    expect(deriveImageNameFromUrl("")).toBe("image-1.jpg");
  });
});

// =============================================================================
// buildImageId
// =============================================================================

describe("buildImageId", () => {
  it("generates id from URL filename", () => {
    const id = buildImageId("https://example.com/sunset.jpg", 0);
    expect(id).toBe("sunset-0");
  });

  it("strips file extension", () => {
    const id = buildImageId("https://example.com/photo.png", 1);
    expect(id).toBe("photo-1");
  });

  it("replaces non-alphanumeric chars with hyphens", () => {
    const id = buildImageId("https://example.com/my photo (1).jpg", 0);
    expect(id).not.toContain(" ");
    expect(id).not.toContain("(");
    expect(id).not.toContain(")");
  });

  it("collapses multiple hyphens", () => {
    const id = buildImageId("https://example.com/a---b.jpg", 0);
    expect(id).not.toContain("--");
  });

  it("truncates to 48 chars max", () => {
    const longUrl = "https://example.com/" + "a".repeat(100) + ".jpg";
    const id = buildImageId(longUrl, 0);
    // base is max 48 chars + '-0' suffix
    expect(id.length).toBeLessThanOrEqual(50);
  });

  it("appends index", () => {
    const id = buildImageId("https://example.com/photo.jpg", 5);
    expect(id).toMatch(/-5$/);
  });

  it('falls back to "image" for empty base', () => {
    const id = buildImageId("https://example.com/.jpg", 0);
    // After stripping extension and special chars, might be empty
    expect(id).toContain("0");
  });
});

// =============================================================================
// normalizeProjectImage
// =============================================================================

describe("normalizeProjectImage", () => {
  it("normalizes a string URL", () => {
    const result = normalizeProjectImage("https://example.com/photo.jpg", 0);
    expect(result).not.toBeNull();
    expect(result!.url).toBe("https://example.com/photo.jpg");
    expect(result!.name).toBe("photo.jpg");
    expect(result!.size).toBe(0);
  });

  it("returns null for non-URL string", () => {
    expect(normalizeProjectImage("not-a-url", 0)).toBeNull();
  });

  it("returns null for null/undefined", () => {
    expect(normalizeProjectImage(null, 0)).toBeNull();
    expect(normalizeProjectImage(undefined, 0)).toBeNull();
  });

  it("normalizes an object with url field", () => {
    const result = normalizeProjectImage(
      {
        url: "https://example.com/photo.jpg",
        name: "My Photo",
        size: 1024,
      },
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.url).toBe("https://example.com/photo.jpg");
    expect(result!.name).toBe("My Photo");
    expect(result!.size).toBe(1024);
  });

  it("normalizes an object with file_url field", () => {
    const result = normalizeProjectImage(
      {
        file_url: "https://example.com/photo.jpg",
      },
      0,
    );
    expect(result).not.toBeNull();
    expect(result!.url).toBe("https://example.com/photo.jpg");
  });

  it("uses existing id if provided", () => {
    const result = normalizeProjectImage(
      {
        id: "custom-id",
        url: "https://example.com/photo.jpg",
      },
      0,
    );
    expect(result!.id).toBe("custom-id");
  });

  it("generates id if not provided", () => {
    const result = normalizeProjectImage(
      {
        url: "https://example.com/photo.jpg",
      },
      0,
    );
    expect(result!.id).toBeTruthy();
    expect(result!.id).not.toBe("");
  });

  it("derives name from URL when not provided", () => {
    const result = normalizeProjectImage(
      {
        url: "https://example.com/sunset.jpg",
      },
      0,
    );
    expect(result!.name).toBe("sunset.jpg");
  });

  it("returns null for object with invalid URL", () => {
    expect(normalizeProjectImage({ url: "not-a-url" }, 0)).toBeNull();
    expect(normalizeProjectImage({ url: "" }, 0)).toBeNull();
  });

  it("sets type from object", () => {
    const result = normalizeProjectImage(
      {
        url: "https://example.com/photo.jpg",
        type: "image/jpeg",
      },
      0,
    );
    expect(result!.type).toBe("image/jpeg");
  });

  it("leaves type undefined when not provided", () => {
    const result = normalizeProjectImage(
      {
        url: "https://example.com/photo.jpg",
      },
      0,
    );
    expect(result!.type).toBeUndefined();
  });
});

// =============================================================================
// normalizeProjectImages
// =============================================================================

describe("normalizeProjectImages", () => {
  it("normalizes an array of URL strings", () => {
    const result = normalizeProjectImages([
      "https://example.com/a.jpg",
      "https://example.com/b.jpg",
    ]);
    expect(result).toHaveLength(2);
    expect(result[0].url).toBe("https://example.com/a.jpg");
    expect(result[1].url).toBe("https://example.com/b.jpg");
  });

  it("normalizes an array of objects", () => {
    const result = normalizeProjectImages([
      { url: "https://example.com/a.jpg", name: "A", size: 100 },
      { url: "https://example.com/b.jpg", name: "B", size: 200 },
    ]);
    expect(result).toHaveLength(2);
  });

  it("deduplicates by URL", () => {
    const result = normalizeProjectImages([
      "https://example.com/a.jpg",
      "https://example.com/a.jpg", // duplicate
      "https://example.com/b.jpg",
    ]);
    expect(result).toHaveLength(2);
  });

  it("filters out invalid entries", () => {
    const result = normalizeProjectImages([
      "https://example.com/a.jpg",
      "not-a-url",
      null,
      undefined,
      42,
    ]);
    expect(result).toHaveLength(1);
  });

  it("returns empty array for non-array input", () => {
    expect(normalizeProjectImages(null)).toHaveLength(0);
    expect(normalizeProjectImages(undefined)).toHaveLength(0);
    expect(normalizeProjectImages("string")).toHaveLength(0);
    expect(normalizeProjectImages(42)).toHaveLength(0);
  });

  it("returns empty array for empty array", () => {
    expect(normalizeProjectImages([])).toHaveLength(0);
  });

  it("handles mixed string and object entries", () => {
    const result = normalizeProjectImages([
      "https://example.com/a.jpg",
      { url: "https://example.com/b.jpg", name: "B" },
    ]);
    expect(result).toHaveLength(2);
  });
});
