import fs from "fs-extra";
import path from "path";
import { outputDir, getAllPosts } from "./utils/index.js";
import {
  copyStaticFiles,
  createPostPages,
  createPostIndexPages,
  generateRSSFeed,
  createGalleryPages,
  createGalleryIndex,
} from "./builders/index.js";
import { __dirname } from "./utils/index.js";

async function buildSite() {
  // Ensure output directory exists
  await fs.ensureDir(outputDir);

  // Read shared components
  const header = await fs.readFile(
    path.join(__dirname, "../ui/header.html"),
    "utf-8"
  );
  const sharedHead = await fs.readFile(
    path.join(__dirname, "../ui/sharedHead.html"),
    "utf-8"
  );

  const posts = await getAllPosts();

  // Create gallery pages and get gallery data
  const galleries = await createGalleryPages(header, sharedHead);

  // First create post pages (this will update post.url for each post)
  await createPostPages(posts, header, sharedHead);

  // Then create index pages using the updated URLs
  await Promise.all([
    createPostIndexPages(posts, header, sharedHead),
    createGalleryIndex(galleries, header, sharedHead),
    copyStaticFiles(header, sharedHead),
    generateRSSFeed(posts),
  ]);
}

// Export the buildSite function for use in other modules
export { buildSite };

// Run buildSite if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildSite().then(() => console.log("Site built!"));
}
