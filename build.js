import fs from "fs-extra";
import path from "path";
import fm from "front-matter";
import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";

import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const postsDir = path.join(__dirname, "posts");
const outputDir = path.join(__dirname, "dist");
const POSTS_PER_PAGE = 5;
const SITE_URL = "https://benjie.ca"; // Replace with your actual site URL
const SITE_TITLE = "Benjie Kibblewhite";
const SITE_DESCRIPTION =
  "A personal blog about web development, accessibility, photography, and whatever else I want."; // Add your site description here

// Configure marked for better output and security
marked.setOptions({
  gfm: true,
  breaks: false,
  pedantic: false,
});

// Add lazyloading to images in markdown
const renderer = {
  image(href, title, text) {
    const titleAttr = title ? ` title="${title}"` : '';
    const altAttr = text ? ` alt="${text}"` : '';
    return `<img src="${href}"${titleAttr}${altAttr} loading="lazy" decoding="async" />`;
  }
};
marked.use({ renderer });
marked.use(markedSmartypants());

// Create a reusable function to generate complete HTML pages
function generateCompletePage({
  content = "",
  title = "",
  header = "",
  sharedHead = "",
  skipHeader = false,
  skipMain = false,
} = {}) {
  const headContent = sharedHead.replace(
    "<head>",
    `<head>\n  <title>${title}</title>`
  );
  if (skipMain) {
    return `<!DOCTYPE html>
        <html lang="en">
          ${headContent}
          <body>
            ${skipHeader ? "" : header}
              ${content}
          </body>
        </html>`;
  }
  return `<!DOCTYPE html>
<html lang="en">
  ${headContent}
  <body>
    ${skipHeader ? "" : header}
    <main>
      ${content}
    </main>
  </body>
</html>`;
}

async function generateRSSFeed(posts) {
  console.log("Generating RSS feed...");

  // Format the current date according to RFC 822
  const pubDate = new Date().toUTCString();

  // Start the RSS XML
  let rssContent = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${SITE_TITLE}</title>
  <link>${SITE_URL}</link>
  <description>${SITE_DESCRIPTION}</description>
  <lastBuildDate>${pubDate}</lastBuildDate>
  <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
`;

  // Add the most recent posts (limit to 20 for RSS feeds)
  const recentPosts = posts.slice(0, 20);

  for (const post of recentPosts) {
    // Parse date for URL structure
    const dateMatch = post.fileDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!dateMatch) continue;

    const [_, year, month, day] = dateMatch;
    const slug = post.filename.replace(/^\d{4}-\d{2}-\d{2}-/, "");
    const postUrl = `${SITE_URL}/blog/${year}/${month}/${day}/${slug}`;

    // Create a clean excerpt without HTML tags
    const excerpt = post.preview.replace(/<[^>]*>?/gm, "");

    // Format the post date according to RFC 822
    const postDate = new Date(post.date).toUTCString();

    // Add the item to RSS feed
    rssContent += `  <item>
    <title>${escapeXML(post.title)}</title>
    <link>${postUrl}</link>
    <guid>${postUrl}</guid>
    <pubDate>${postDate}</pubDate>
    <description>${escapeXML(excerpt)}</description>
  </item>\n`;
  }

  // Close the RSS XML
  rssContent += `</channel>
</rss>`;

  // Write the RSS file to the output directory
  await fs.outputFile(path.join(outputDir, "rss.xml"), rssContent);
  console.log("RSS feed generated successfully!");
}

// Helper function to escape XML special characters
function escapeXML(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Helper function to detect and extract complete markdown links
function extractCompleteLinks(text) {
  // Regular expression to match markdown links: [text](url) or [text](url "title")
  const linkRegex = /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g;
  const links = [];
  let match;
  
  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      fullMatch: match[0],
      text: match[1],
      url: match[2],
      title: match[3] || ''
    });
  }
  
  return links;
}

// Helper function to generate preview text that includes complete links
function generatePreviewWithLinks(text, maxLength = 150) {
  const links = extractCompleteLinks(text);
  
  if (links.length === 0) {
    // No links found, use simple truncation
    return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
  }
  
  // Find the first link and ensure it's included in the preview
  const firstLink = links[0];
  const linkStartIndex = text.indexOf(firstLink.fullMatch);
  
  if (linkStartIndex === -1) {
    // Link not found in text (shouldn't happen), fallback to simple truncation
    return text.substring(0, maxLength) + (text.length > maxLength ? "..." : "");
  }
  
  // Calculate where to end the preview to include the complete first link
  const linkEndIndex = linkStartIndex + firstLink.fullMatch.length;
  const previewEndIndex = Math.max(linkEndIndex, maxLength);
  
  // Extract preview text
  let preview = text.substring(0, previewEndIndex);
  
  // Add ellipsis if we truncated the text
  if (previewEndIndex < text.length) {
    preview += "...";
  }
  
  return preview;
}

async function copyStaticFiles(header, sharedHead) {
  // Copy pages directory to dist if it exists
  const pagesDir = path.join(__dirname, "pages");
  const staticDir = path.join(__dirname, "static");
  if (await fs.pathExists(pagesDir)) {
    const pageFiles = await fs.readdir(pagesDir);

    // Process each file
    for (const file of pageFiles) {
      const filePath = path.join(pagesDir, file);
      const fileStats = await fs.stat(filePath);

      if (fileStats.isDirectory()) {
        // For directories, just copy them
        await fs.copy(filePath, path.join(outputDir, path.basename(file)), {
          overwrite: true,
        });
      } else {
        // For HTML files, apply template
        if (file.endsWith(".html")) {
          const content = await fs.readFile(filePath, "utf-8");
          const title = "Benjie K.";

          // Generate complete page with content directly (no extraction needed)
          const completePage = generateCompletePage({
            content,
            title,
            header,
            sharedHead,
          });

          // Write to output directory
          await fs.outputFile(path.join(outputDir, file), completePage);
        } else {
          // For non-HTML files, just copy them
          await fs.copy(filePath, path.join(outputDir, file), {
            overwrite: true,
          });
        }
      }
    }
  }

  if (await fs.pathExists(staticDir)) {
    const staticFiles = await fs.readdir(staticDir);
    for (const file of staticFiles) {
      const filePath = path.join(staticDir, file);

      await fs.copy(filePath, path.join(outputDir, `static/${file}`), {
        overwrite: true,
      });
    }
  }

  // Copy unbuilt-pages files directly to dist if the directory exists
  const unbuiltPagesDir = path.join(__dirname, "unbuilt-pages");
  if (await fs.pathExists(unbuiltPagesDir)) {
    const unbuiltFiles = await fs.readdir(unbuiltPagesDir);
    for (const file of unbuiltFiles) {
      const filePath = path.join(unbuiltPagesDir, file);
      await fs.copy(filePath, path.join(outputDir, file), {
        overwrite: true,
      });
    }
  }

  // Copy menu.html to dist
  const menuFile = path.join(__dirname, "pages/menu.html");
  const exists = await fs.pathExists(menuFile);
  if (exists) {
    const menuContent = await fs.readFile(menuFile, "utf-8");

    // Generate complete page with content directly
    const completePage = generateCompletePage({
      content: menuContent,
      title: "Menu",
      header,
      sharedHead,
      skipHeader: true,
      skipMain: true,
    });

    // Write to output directory
    await fs.outputFile(path.join(outputDir, "menu.html"), completePage);
  }
}

async function getAllPosts() {
  const files = await fs.readdir(postsDir);
  const posts = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    const fileDate = dateMatch ? dateMatch[1] : null;
    const filePath = path.join(postsDir, file);
    const content = await fs.readFile(filePath, "utf-8");
    const { attributes, body } = fm(content);

    // Find first text paragraph (skip images, code blocks, etc)
    const firstParagraph =
      body
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 0 &&
            !line.startsWith("![") && // skip images
            !line.startsWith("```") && // skip code blocks
            !line.startsWith("#") // skip headers
        )[0] || "";

    posts.push({
      title: attributes.title,
      date: attributes.date,
      preview: generatePreviewWithLinks(firstParagraph, 150),
      filename: file.replace(".md", ".html"),
      content: body,
      attributes,
      fileDate,
    });
  }

  return posts.sort((a, b) => {
    if (!a.fileDate || !b.fileDate) return 0;
    return new Date(b.fileDate).getTime() - new Date(a.fileDate).getTime();
  });
}

async function createPostPages(posts, header, sharedHead) {
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

function createPaginationLinks(currentPage, totalPages) {
  let links = [];

  // Add back arrow
  // if (currentPage > 1) {
  const prevPage = currentPage - 1;
  const filename = prevPage === 1 ? "index.html" : `page${prevPage}.html`;
  links.push(
    `<a href="/blog/${filename}" class="pagination-arrow${
      currentPage === 1 ? " disabled" : ""
    }">&larr;</a>`
  );
  // }

  // Add page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      links.push(`<span class="current-page">${i}</span>`);
    } else {
      const filename = i === 1 ? "index.html" : `page${i}.html`;
      links.push(`<a href="/blog/${filename}">${i}</a>`);
    }
  }

  // Add forward arrow
  // if (currentPage < totalPages) {
  const nextPage = currentPage + 1;
  links.push(
    `<a href="/blog/page${nextPage}.html" class="pagination-arrow${
      currentPage === totalPages ? " disabled" : ""
    }">&rarr;</a>`
  );
  // }

  return links.join(" ");
}

async function createIndexPages(posts, header, sharedHead) {
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const blogDir = path.join(outputDir, "blog");

  // Ensure blog directory exists
  await fs.ensureDir(blogDir);

  for (let page = 1; page <= totalPages; page++) {
    const startIdx = (page - 1) * POSTS_PER_PAGE;
    const pagePosts = posts.slice(startIdx, startIdx + POSTS_PER_PAGE);

    // Replace placeholder head with dynamic title
    const headContent = sharedHead.replace(
      "<head>",
      `<head>\n  <title>My Blog${page > 1 ? ` - Page ${page}` : ""}</title>`
    );

    const indexContent = `<!DOCTYPE html>
<html lang="en">
  ${headContent}
  <body>
    ${header}
    <main>
      ${pagePosts
        .map((post) => {
          const postId = post.title.replace(/[^A-Z0-9]/gi, "");
          return `
              <article>
                <h2><a id='${postId}' href="${post.url}" class='post-link' style="view-transition-name: post-${postId}">${post.title}</a></h2>
                <p>${post.date}</p>
                <p>${marked.parse(post.preview)}</p>
              </article>
            `;
        })
        .join("\n")}
      <nav class="pagination">
        ${createPaginationLinks(page, totalPages)}
      </nav>
    </main>
  </body>
</html>`;

    const filename = page === 1 ? "index.html" : `page${page}.html`;
    await fs.outputFile(path.join(blogDir, filename), indexContent);
  }
}

async function buildSite() {
  // Ensure output directory exists
  await fs.ensureDir(outputDir);

  // Read shared components
  const header = await fs.readFile(
    path.join(__dirname, "ui/header.html"),
    "utf-8"
  );
  const sharedHead = await fs.readFile(
    path.join(__dirname, "ui/sharedHead.html"),
    "utf-8"
  );

  const posts = await getAllPosts();

  // First create post pages (this will update post.url for each post)
  await createPostPages(posts, header, sharedHead);

  // Then create index pages using the updated URLs
  await Promise.all([
    createIndexPages(posts, header, sharedHead),
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
