import type { BunRequest } from "bun";
import path from "path";
import { getBearerToken, validateJWT } from "../auth";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig, VIDEO_UPLOAD_ROUTE } from "../types/api";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";

const MAX_UPLOAD_SIZE = 1 << 30;
const VALID_VIDEO_TYPES = ["video/mp4"];

export async function handlerUploadVideo(
  cfg: ApiConfig,
  req: BunRequest<VIDEO_UPLOAD_ROUTE>,
) {
  const { videoId } = req.params;
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Video not found");
  }
  if (video?.userID !== userID) {
    throw new UserForbiddenError(
      "You are not allowed to upload a video for this video ID",
    );
  }

  const formData = await req.formData();
  const file = formData.get("video");

  if (!(file instanceof File)) {
    throw new BadRequestError("Invalid video file");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new BadRequestError("Video exceeds the maximum allowed size of 1GB");
  }

  const mediaType = file.type;
  if (!mediaType || !VALID_VIDEO_TYPES.includes(mediaType)) {
    throw new BadRequestError("Invalid or missing Content-Type for video");
  }

  const tmpPath = path.join(cfg.assetsRoot, `tmp-${videoId}.mp4`);
  await Bun.write(tmpPath, file);

  try {
    const s3Key = `${videoId}.mp4`;
    await cfg.s3Client
      .file(s3Key, {
        bucket: cfg.s3Bucket,
      })
      .write(Bun.file(tmpPath), {
        type: mediaType,
      });
  } finally {
    await Bun.file(tmpPath).unlink();
  }

  video.videoURL = `https://${cfg.s3Bucket}.s3.${cfg.s3Region}.amazonaws.com/${videoId}.mp4`;
  updateVideo(cfg.db, video);

  return respondWithJSON(200, null);
}
