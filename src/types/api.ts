import type { S3Client } from "bun";
import type { Database } from "bun:sqlite";

export type ApiConfig = {
  db: Database;
  jwtSecret: string;
  platform: string;
  filepathRoot: string;
  assetsRoot: string;
  s3Bucket: string;
  s3Client: S3Client;
  s3Region: string;
  s3CfDistribution: string;
  port: string;
};

export type THUMBNAIL_UPLOAD_ROUTE = "/api/thumbnail_upload/:videoId";
export type VIDEO_UPLOAD_ROUTE = "/api/video_upload/:videoId";
