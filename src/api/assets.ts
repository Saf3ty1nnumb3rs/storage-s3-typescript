import { existsSync, mkdirSync } from "fs";
import type { ApiConfig } from "../types/api";

export function ensureAssetsDir(cfg: ApiConfig) {
  if (!existsSync(cfg.assetsRoot)) {
    mkdirSync(cfg.assetsRoot, { recursive: true });
  }
}
