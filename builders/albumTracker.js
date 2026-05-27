import fs from "fs-extra";
import path from "path";
import { outputDir, __dirname } from "../utils/index.js";

export async function buildAlbumTracker() {
  const albumTrackerFrontendDir = path.join(__dirname, "../album-tracker/frontend");
  const albumTrackerOutputDir = path.join(outputDir, "album-tracker");

  // Ensure album-tracker source directory exists
  if (!await fs.pathExists(albumTrackerFrontendDir)) {
    console.log("Album tracker frontend directory not found, skipping...");
    return;
  }

  // Ensure output directory exists
  await fs.ensureDir(albumTrackerOutputDir);

  // Copy all frontend files to dist/album-tracker
  await fs.copy(albumTrackerFrontendDir, albumTrackerOutputDir, {
    overwrite: true,
    filter: (src) => {
      // Don't copy the supabase directory (if it exists in frontend)
      const basename = path.basename(src);
      return basename !== "supabase";
    },
  });

  console.log("Album tracker built!");
}
