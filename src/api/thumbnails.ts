import type { BunRequest } from "bun";
import { randomBytes } from "crypto";
import path from "path";
import { getBearerToken, validateJWT } from "../auth";
import { getVideo, updateVideo } from "../db/videos";
import type { ApiConfig, THUMBNAIL_UPLOAD_ROUTE } from "../types/api";
import { BadRequestError, NotFoundError, UserForbiddenError } from "./errors";
import { respondWithJSON } from "./json";

const MAX_UPLOAD_SIZE = 10 << 20; // 10 MB
const VALID_THUMBNAIL_TYPES = ["image/jpeg", "image/png"];

export async function handlerUploadThumbnail(
  cfg: ApiConfig,
  req: BunRequest<THUMBNAIL_UPLOAD_ROUTE>,
) {
  const { videoId } = req.params as { videoId?: string };
  if (!videoId) {
    throw new BadRequestError("Invalid video ID");
  }

  const token = getBearerToken(req.headers);
  const userID = validateJWT(token, cfg.jwtSecret);

  const video = getVideo(cfg.db, videoId);
  if (!video) {
    throw new NotFoundError("Couldn't find video");
  }
  if (video?.userID !== userID) {
    throw new UserForbiddenError(
      "You are not allowed to upload a thumbnail for this video",
    );
  }

  const formData = await req.formData();
  const file = formData.get("thumbnail");

  if (!(file instanceof File)) {
    throw new BadRequestError("Invalid thumbnail");
  }
  if (file.size > MAX_UPLOAD_SIZE) {
    throw new BadRequestError(
      "Thumbnail exceeds the maximum allowed size of 10MB",
    );
  }

  const mediaType = file.type;
  if (!mediaType || !VALID_THUMBNAIL_TYPES.includes(mediaType)) {
    throw new BadRequestError("Invalid or missing Content-Type for thumbnail");
  }

  const fileData = await file.arrayBuffer();
  if (!fileData) {
    throw new Error("Error reading file data");
  }

  const extension = mediaType.split("/")[1];
  const fileName = `${randomBytes(32).toString("base64url")}.${extension}`;
  const filePath = path.join(cfg.assetsRoot, fileName);

  await Bun.write(filePath, fileData);

  video.thumbnailURL = `http://localhost:${cfg.port}/assets/${fileName}`;
  updateVideo(cfg.db, video);

  return respondWithJSON(200, { video });
}
