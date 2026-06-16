import { v2 as cloudinary } from "cloudinary";
import { prisma } from "../config/prisma.js";
import { cloudinaryConfig, assertCloudinaryReady } from "../config/cloudinary.js";

type CloudinaryResource = {
  public_id: string;
  resource_type: string;
  bytes?: number;
  created_at?: string;
};

cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
  secure: true
});

async function referencedPublicIds() {
  const rows = await prisma.teacherStudyMaterialRecord.findMany({
    where: {
      OR: [
        { cloudinaryPublicId: { not: null } },
        { thumbnailPublicId: { not: null } }
      ]
    },
    select: { cloudinaryPublicId: true, thumbnailPublicId: true }
  });
  return new Set(rows.flatMap((row) => [row.cloudinaryPublicId, row.thumbnailPublicId]).filter((id): id is string => Boolean(id)));
}

async function listResources(resourceType: "image" | "video" | "raw") {
  const resources: CloudinaryResource[] = [];
  let nextCursor: string | undefined;
  do {
    const result = await cloudinary.api.resources({
      type: "authenticated",
      prefix: "nidus/",
      resource_type: resourceType,
      max_results: 500,
      next_cursor: nextCursor
    });
    resources.push(...(result.resources ?? []));
    nextCursor = result.next_cursor;
  } while (nextCursor);
  return resources;
}

async function main() {
  if (!assertCloudinaryReady()) {
    console.log("Cloudinary is not configured. Reconciliation skipped.");
    return;
  }

  const referenced = await referencedPublicIds();
  const resources = (await Promise.all([listResources("image"), listResources("video"), listResources("raw")])).flat();
  const orphaned = resources.filter((resource) => !referenced.has(resource.public_id));

  console.log(JSON.stringify({
    mode: "dry-run",
    referencedAssets: referenced.size,
    cloudinaryAssets: resources.length,
    orphanedAssets: orphaned.length,
    orphaned: orphaned.map((resource) => ({
      publicId: resource.public_id,
      resourceType: resource.resource_type,
      bytes: resource.bytes,
      createdAt: resource.created_at
    }))
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
