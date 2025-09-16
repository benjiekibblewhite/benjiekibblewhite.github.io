import { postsDir, generatePreviewWithLinks } from "./index.js";
import fs from "fs-extra";
import path from "path";
import fm from "front-matter";

export async function getAllPosts() {
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
