import type { Video } from "../../db/videos";
import type { ApiConfig, AspectRatioOrientation } from "../../types/api";

type FFProbeOutput = {
  streams: Array<{ width?: number; height?: number }>;
};

export function dbVideoToSignedVideo(cfg: ApiConfig, video: Video) {
  if (!video.videoURL) {
    return video;
  }

  video.videoURL = generatePresignedURL(cfg, video.videoURL, 5 * 60);

  return video;
}

export function generatePresignedURL(
  cfg: ApiConfig,
  key: string,
  expireTime: number,
): string {
  return cfg.s3Client.presign(`${key}`, { expiresIn: expireTime });
}

export function getAspectRatioOrientation(
  height: number,
  width: number,
): AspectRatioOrientation {
  if (width <= 0 || height <= 0) return "other";

  const ratio = width / height;

  const TARGET_LANDSCAPE = 16 / 9; // ~1.7778
  const TARGET_PORTRAIT = 9 / 16; // ~0.5625
  const LANDSCAPE_TOLERANCE = 0.45;
  const PORTRAIT_TOLERANCE = 0.2;

  if (Math.abs(ratio - TARGET_LANDSCAPE) <= LANDSCAPE_TOLERANCE) {
    return "landscape";
  }

  if (Math.abs(ratio - TARGET_PORTRAIT) <= PORTRAIT_TOLERANCE) {
    return "portrait";
  }

  return "other";
}

export async function getVideoAspectRatio(
  filePath: string,
): Promise<AspectRatioOrientation> {
  const proc = Bun.spawn(
    [
      "ffprobe",
      "-v",
      "error",
      "-select_streams",
      "v:0",
      "-show_entries",
      "stream=width,height",
      "-of",
      "json",
      filePath,
    ],
    {
      stdout: "pipe",
      stderr: "pipe",
    },
  );

  const { stdout, stderr } = proc;
  if (!stdout || !stderr) {
    throw new Error("Failed to open ffprobe streams");
  }

  const [stdoutText, stderrText, exited] = await Promise.all([
    new Response(stdout).text(),
    new Response(stderr).text(),
    proc.exited,
  ]);

  if (exited !== 0) {
    throw new Error(`ffprobe failed with exit code ${exited}: ${stderrText}`);
  }

  const output: FFProbeOutput = JSON.parse(stdoutText);
  const stream = output.streams[0];
  if (!stream) {
    throw new Error("No video stream found in the file");
  }

  const { width, height } = stream;
  const orientation = getAspectRatioOrientation(height ?? 0, width ?? 0);

  return orientation;
}

export async function processVideoForFastStart(
  filePath: string,
): Promise<string> {
  const processedFilePath = `${filePath}.processed.mp4`;
  const proc = Bun.spawn(
    [
      "ffmpeg",
      "-i",
      filePath,
      "-movflags",
      "faststart",
      "-map_metadata",
      "0",
      "-codec",
      "copy",
      "-f",
      "mp4",
      processedFilePath,
    ],
    {
      stderr: "pipe",
    },
  );
  const { stderr } = proc;
  if (!stderr) {
    throw new Error("Failed to open ffmpeg streams");
  }

  const [stderrText, exited] = await Promise.all([
    new Response(stderr).text(),
    proc.exited,
  ]);

  if (exited !== 0) {
    throw new Error(`ffmpeg failed with exit code ${exited}: ${stderrText}`);
  }
  return processedFilePath;
}

export async function uploadVideoToS3(
  cfg: ApiConfig,
  s3Key: string,
  filePath: string,
  type: string,
) {
  await cfg.s3Client
    .file(s3Key, {
      bucket: cfg.s3Bucket,
    })
    .write(Bun.file(filePath), {
      type,
    });
}
