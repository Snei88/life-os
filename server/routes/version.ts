// server/routes/version.ts
import { Router, Request, Response } from "express";

const router = Router();

function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const a = parts1[i] ?? 0;
    const b = parts2[i] ?? 0;
    if (a < b) return -1;
    if (a > b) return 1;
  }
  return 0;
}

// GET /api/version/check?version=1.0.0
// Config via env vars:
//   APP_LATEST_VERSION  - e.g. "1.1.0"
//   APP_UPDATE_REQUIRED - "true" to force update
//   APP_UPDATE_URL      - store URL for the update
//   APP_UPDATE_MESSAGE  - custom message to display
router.get("/check", (req: Request, res: Response) => {
  const { version } = req.query;
  const clientVersion = typeof version === "string" ? version.trim() : "0.0.0";

  const latestVersion = process.env.APP_LATEST_VERSION || "1.0.0";
  const isRequired = process.env.APP_UPDATE_REQUIRED === "true";
  const updateUrl =
    process.env.APP_UPDATE_URL ||
    "https://play.google.com/store/apps/details?id=co.trulab.lifeos";
  const message =
    process.env.APP_UPDATE_MESSAGE ||
    "Hay una nueva versión disponible con mejoras y correcciones.";

  const isOutdated = compareVersions(clientVersion, latestVersion) < 0;

  res.json({
    latestVersion,
    clientVersion,
    isOutdated,
    isRequired: isOutdated && isRequired,
    updateUrl,
    message: isOutdated ? message : null,
  });
});

export default router;
