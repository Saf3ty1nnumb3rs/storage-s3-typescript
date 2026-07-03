import type { BunRequest } from "bun";
import { rm } from "fs/promises";
import path from "path";
import { getBearerToken, validateJWT } from "../auth";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig, VIDEO_UPLOAD_ROUTE } from "../types/api";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";
import {
  getVideoAspectRatio,
  processVideoForFastStart,
  uploadVideoToS3,
} from "./utils/videoHelpers";

const MAX_UPLOAD_SIZE = 1 << 30;
const VALID_VIDEO_TYPES = ["video/mp4"] as const;

export async function handlerUploadVideo(
  cfg: ApiConfig,
  req: BunRequest<VIDEO_UPLOAD_ROUTE>,
) {
  const { videoId } = req.params;

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Video not found");
  }
  if (video.userID !== userID) {
    throw new UserForbiddenError(
      "You are not allowed to upload a video for this video ID",
    );
  }

  const formData = await req.formData();
  const file = formData.get("video");
  if (!(file instanceof File)) {
    throw new BadRequestError("Video file missing or invalid");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new BadRequestError("Video exceeds the maximum allowed size of 1GB");
  }
  if (!(VALID_VIDEO_TYPES as readonly string[]).includes(file.type)) {
    throw new BadRequestError("Invalid or missing Content-Type for video");
  }

  const tmpPath = path.join("/tmp", `${videoId}.mp4`);
  await Bun.write(tmpPath, file);

  try {
    const orientationPrefix = await getVideoAspectRatio(tmpPath);
    const processedFilePath = await processVideoForFastStart(tmpPath);
    const s3Key = `${orientationPrefix}/${videoId}.mp4`;

    await uploadVideoToS3(cfg, s3Key, processedFilePath, file.type);

    video.videoURL = `https://${cfg.s3CfDistribution}/${s3Key}`;
    updateVideo(cfg.db, video);
  } finally {
    await Promise.all([
      rm(tmpPath, { force: true }),
      rm(`${tmpPath}.processed.mp4`, { force: true }),
    ]);
  }

  return respondWithJSON(200, null);
}
