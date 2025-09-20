import fs from "fs-extra";
import path from "path";
import { outputDir } from "../utils/index.js";

export async function createGalleryIndex(galleries, header, sharedHead) {
  if (galleries.length === 0) {
    console.log("No galleries found, skipping gallery index creation");
    return;
  }

  // Sort galleries by date (newest first)
  galleries.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const sharedHeadContent = sharedHead;

  const galleriesHtml = galleries
    .map(
      (gallery) => `
    <a href="${gallery.url}">
      <article class="gallery-preview">
          <div class="gallery-preview-content">
            <h2>${gallery.title}</h2>
            <div class="gallery-meta">
              <span class="gallery-date">${gallery.date}</span>
              <span class="gallery-count">${gallery.photoCount} photos</span>
            </div>
            ${
              gallery.tags.length > 0
                ? `
              <div class="gallery-tags">
                ${gallery.tags
                  .map((tag) => `<span class="tag">${tag}</span>`)
                  .join("")}
              </div>
            `
                : ""
            }
            ${
              gallery.photos.length > 0
                ? `
              <div class="gallery-preview_images">
                ${gallery.photos
                  .map((photo, index) =>
                    index <= 6
                      ? `<div class="gallery-preview_image"><img src="${photo.optimizedPath}" /></div>`
                      : ""
                  )
                  .join("")}
              </div>
              `
                : ""
            }
          </div>
        </article>
      </a>
  `
    )
    .join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  ${sharedHeadContent.replace(
    "<head>",
    "<head>\n    <title>Photo Galleries</title>"
  )}
  <link rel="stylesheet" href="/static/gallery-index.css" />
  </head>
  <body>
    ${header}
    <main>
      <div class="galleries-container">
        <div class="galleries-header">
          <h1>Photos</h1>
          <p>I'm trying to get better at photography. Here's a few things that I've liked.</p>
        </div>
        
        ${
          galleries.length > 0
            ? galleriesHtml
            : `
          <div class="no-galleries">
            <h2>No galleries yet</h2>
            <p>Check back soon for photo galleries!</p>
          </div>
        `
        }
      </div>
    </main>
  </body>
</html>`;

  // Write the gallery index page
  const outputPath = path.join(outputDir, "photos");

  await fs.ensureDir(outputPath);
  const filePath = path.join(outputPath, "index.html");
  await fs.writeFile(filePath, htmlContent);

  console.log(`Created gallery index with ${galleries.length} galleries`);
}
