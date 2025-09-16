import fs from "fs-extra";
import path from "path";
import { marked, outputDir } from "../utils/index.js";

export async function createPostPages(posts, header, sharedHead) {
  for (const post of posts) {
    // Parse date for directory structure
    const dateMatch = post.fileDate.match(/^(\d{4})-(\d{2})-(\d{2})/);

    if (!dateMatch) continue;

    const [_, year, month, day] = dateMatch;

    // Extract slug from filename (remove date prefix)
    const slug = post.filename.replace(/^\d{4}-\d{2}-\d{2}-/, "");

    // Create new path structure: /blog/YYYY/MM/DD/slug.html
    const postOutputDir = path.join(outputDir, "blog", year, month, day);

    // Replace placeholder head with dynamic title
    const headContent = sharedHead.replace(
      "<head>",
      `<head>\n  <title>${post.title}</title>`
    );
    const postId = post.title.replace(/[^A-Z0-9]/gi, "");

    const htmlContent = `<!DOCTYPE html>
            <html lang="en">
              ${headContent}
              <body>
                ${header}
                <main>
                  <h1 class='post-title' id="${postId}" style='view-transition-name: post-${postId}'">${
      post.title
    }</h1>
                  <p>${post.date}</p>
                  <div>${marked.parse(post.content)}</div>
                  <p>by ${post.attributes.author}</p>
                  <p>Tags: ${post.attributes.tags?.join(", ") || "None"}</p>
                </main>
              </body>
            </html>`;

    // Update post.filename with new path for use in links
    post.url = `/blog/${year}/${month}/${day}/${slug}`;

    // Ensure directory exists
    await fs.ensureDir(postOutputDir);
    const outputFilePath = path.join(postOutputDir, slug);
    await fs.outputFile(outputFilePath, htmlContent);
  }
}
