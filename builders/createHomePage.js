import fs from "fs-extra";
import path from "path";
import { outputDir, __dirname } from "../utils/index.js";
import { generateCompletePage } from "./index.js";

// Builds the home page from pages/index.html, filling in the
// <!-- latest-posts --> and <!-- recent-photos --> placeholders.
// The footer is pulled out of the content so it lands outside <main>
// (keeping the contentinfo landmark).
export async function createHomePage(posts, galleries, header, sharedHead) {
  const sourcePath = path.join(__dirname, "../pages/index.html");
  if (!(await fs.pathExists(sourcePath))) return;

  let content = await fs.readFile(sourcePath, "utf-8");

  const latestPosts = posts.slice(0, 3);
  const postsHtml = `
  <section class="home-section">
    <h2>Latest posts</h2>
    <ul class="home-list">
      ${latestPosts
        .map(
          (post) =>
            `<li><a href="${post.url}">${post.title}</a> <span class="home-list-date">${post.fileDate}</span></li>`
        )
        .join("\n      ")}
    </ul>
  </section>`;

  const recentGalleries = [...galleries]
    .sort((a, b) => b.folder.localeCompare(a.folder))
    .slice(0, 3);
  const photosHtml = `
  <section class="home-section">
    <h2>Recent photos</h2>
    <ul class="home-list">
      ${recentGalleries
        .map(
          (gallery) =>
            `<li><a href="${gallery.url}">${gallery.title}</a> <span class="home-list-date">${gallery.photoCount} photos</span></li>`
        )
        .join("\n      ")}
    </ul>
  </section>`;

  content = content
    .replace("<!-- latest-posts -->", postsHtml)
    .replace("<!-- recent-photos -->", photosHtml);

  // Move the footer outside the main landmark
  const footerMatch = content.match(/<footer[\s\S]*<\/footer>/);
  let footer = "";
  if (footerMatch) {
    footer = footerMatch[0];
    content = content.replace(footer, "");
  }

  const page = generateCompletePage({
    content,
    title: "Benjie K.",
    header,
    sharedHead,
  }).replace("</main>", `</main>\n      ${footer}`);

  await fs.outputFile(path.join(outputDir, "index.html"), page);
}
