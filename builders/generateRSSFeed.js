import fs from "fs-extra";
import path from "path";
import { outputDir, escapeXML } from "../utils/index.js";

const SITE_URL = "https://benjie.ca"; // Replace with your actual site URL
const SITE_TITLE = "Benjie Kibblewhite";
const SITE_DESCRIPTION =
  "A personal blog about web development, accessibility, photography, and whatever else I want."; // Add your site description here

export async function generateRSSFeed(posts) {
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
