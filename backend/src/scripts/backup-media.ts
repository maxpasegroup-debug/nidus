import { env } from "../config/env.js";

const stamp = new Date().toISOString().slice(0, 10);
const prefix = `${env.MEDIA_BACKUP_PREFIX}/${stamp}`;

console.log("NIDUS media backup plan");
console.log(`Cloudinary cloud: ${env.CLOUDINARY_CLOUD_NAME || "not configured"}`);
console.log(`Target prefix: ${env.BACKUP_BUCKET ? `${env.BACKUP_BUCKET}/${prefix}` : prefix}`);
console.log("Export Cloudinary assets through the provider API or scheduled export job, then store the manifest and archive in the backup target.");
