import { ProjectImage } from "@/types/intake";

export interface NormalizedProjectImage extends ProjectImage {
  id: string;
}

const IMAGE_URL_REGEX = /^(https?:\/\/|data:image\/|blob:)/i;

export function isLikelyImageUrl(value: string): boolean {
  return IMAGE_URL_REGEX.test(value);
}

export function deriveImageNameFromUrl(
  url: string,
  fallbackIndex?: number,
): string {
  try {
    const withoutQuery = url.split("?")[0];
    const lastSegment = withoutQuery.split("/").pop() || "";
    if (lastSegment) return decodeURIComponent(lastSegment);
  } catch {
    // Ignore parse failures and use fallback.
  }
  return `image-${(fallbackIndex ?? 0) + 1}.jpg`;
}

export function buildImageId(url: string, index: number): string {
  const base = deriveImageNameFromUrl(url, index)
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return `${base || "image"}-${index}`;
}

export function normalizeProjectImage(
  image: unknown,
  index: number,
): NormalizedProjectImage | null {
  if (!image) return null;

  if (typeof image === "string") {
    if (!isLikelyImageUrl(image)) return null;
    return {
      id: buildImageId(image, index),
      url: image,
      name: deriveImageNameFromUrl(image, index),
      size: 0,
      type: undefined,
    };
  }

  if (typeof image === "object") {
    const img = image as Record<string, unknown>;
    const rawUrl =
      typeof img.url === "string"
        ? img.url
        : typeof img.file_url === "string"
          ? img.file_url
          : "";

    if (!rawUrl || !isLikelyImageUrl(rawUrl)) return null;

    const id =
      typeof img.id === "string" && img.id.trim().length > 0
        ? img.id
        : buildImageId(rawUrl, index);
    const name =
      typeof img.name === "string" && img.name.trim().length > 0
        ? img.name
        : deriveImageNameFromUrl(rawUrl, index);
    const size =
      typeof img.size === "number" && Number.isFinite(img.size) ? img.size : 0;
    const type = typeof img.type === "string" ? img.type : undefined;

    return {
      id,
      url: rawUrl,
      name,
      size,
      type,
    };
  }

  return null;
}

export function normalizeProjectImages(
  images: unknown,
): NormalizedProjectImage[] {
  if (!Array.isArray(images)) return [];

  const normalized: NormalizedProjectImage[] = [];
  const seenUrls = new Set<string>();

  images.forEach((img, index) => {
    const candidate = normalizeProjectImage(img, index);
    if (!candidate) return;
    if (seenUrls.has(candidate.url)) return;
    seenUrls.add(candidate.url);
    normalized.push(candidate);
  });

  return normalized;
}
