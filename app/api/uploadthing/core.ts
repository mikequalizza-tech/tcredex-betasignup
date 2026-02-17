import { createClient } from "@/lib/supabase/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

const handleAuth = async () => {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { userId: user.id };
};

export const ourFileRouter = {
  // For deal documents
  dealDocument: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
    "application/vnd.ms-excel": { maxFileSize: "16MB", maxFileCount: 10 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      maxFileSize: "16MB",
      maxFileCount: 10,
    },
  })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Deal document uploaded:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // For chat message attachments
  messageAttachment: f({
    image: { maxFileSize: "4MB", maxFileCount: 5 },
    pdf: { maxFileSize: "8MB", maxFileCount: 3 },
    "application/msword": { maxFileSize: "8MB", maxFileCount: 3 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      maxFileSize: "8MB",
      maxFileCount: 3,
    },
  })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Message attachment uploaded:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // For organization logos/images
  organizationImage: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Organization image uploaded:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // For user avatars
  userAvatar: f({ image: { maxFileSize: "1MB", maxFileCount: 1 } })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] User avatar uploaded:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // For deal/project images (photos, renderings, site images)
  dealImage: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UploadThing] Deal image uploaded:", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
