import fs from "fs-extra";
import path from "path";
import { marked, outputDir } from "../utils/index.js";

function postUrl(post) {
  const [year, month, day] = post.fileDate.split("-");
  const slug = post.filename.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  return `/blog/${year}/${month}/${day}/${slug}`;
}

export async function createPostPages(posts, header, sharedHead) {
  // posts are sorted newest-first, so i-1 is newer and i+1 is older
  for (let i = 0; i < posts.length; i++) {
    const post = posts[i];
    const newerPost = posts[i - 1];
    const olderPost = posts[i + 1];
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
    // Date prefix keeps the id unique even when two titles collide
    const postId = `${post.fileDate}-${post.title.replace(/[^A-Z0-9]/gi, "")}`;

    const htmlContent = `<!DOCTYPE html>
            <html lang="en">
              ${headContent}
              <body>
                ${header}
                 <main class='blog-page' id="main-content">
                  <h1 class='post-title' id="${postId}" style='view-transition-name: post-${postId}'>${
      post.title
    }</h1>
                  <p class="post-meta">${post.displayDate} · by ${
      post.attributes.author
    }</p>
                  <div>${marked.parse(post.content)}</div>
                  <p class="post-meta">Tags: ${
                    post.attributes.tags?.join(", ") || "None"
                  }</p>
                  <nav class="post-nav" aria-label="More posts">
                    <a href="/blog/">&larr; All posts</a>
                    <span class="post-nav-links">
                      ${
                        newerPost
                          ? `<a href="${postUrl(newerPost)}">&larr; ${newerPost.title}</a>`
                          : ""
                      }
                      ${
                        olderPost
                          ? `<a href="${postUrl(olderPost)}">${olderPost.title} &rarr;</a>`
                          : ""
                      }
                    </span>
                  </nav>
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
