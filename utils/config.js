import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

export const postsDir = path.join(__dirname, "../posts");
export const outputDir = path.join(__dirname, "../dist");
export const POSTS_PER_PAGE = 5;
