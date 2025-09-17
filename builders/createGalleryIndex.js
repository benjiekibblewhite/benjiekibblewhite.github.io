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
    <article class="gallery-preview">
      <div class="gallery-preview-content">
        <h2><a href="${gallery.url}">${gallery.title}</a></h2>
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
      </div>
    </article>
  `
    )
    .join("");

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
  ${sharedHeadContent.replace(
    "<head>",
    "<head>\n    <title>Photo Galleries</title>"
  )}
    
    <style>
      .galleries-container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      .galleries-header {
        margin-bottom: 3rem;
        text-align: center;
      }
      
      .galleries-header h1 {
        font-size: 3rem;
        margin-bottom: 1rem;
      }
      
      .galleries-header p {
        color: #666;
        font-size: 1.1rem;
      }
      
      .gallery-preview {
        margin-bottom: 2rem;
        padding: 1.5rem;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        transition: box-shadow 0.2s ease;
      }
      
      .gallery-preview:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .gallery-preview h2 {
        margin: 0 0 1rem 0;
        font-size: 1.5rem;
      }
      
      .gallery-preview h2 a {
        color: #333;
        text-decoration: none;
        transition: color 0.2s ease;
      }
      
      .gallery-preview h2 a:hover {
        color: #58aceb;
      }
      
      .gallery-meta {
        margin-bottom: 1rem;
        color: #666;
        font-size: 0.9rem;
      }
      
      .gallery-meta span {
        margin-right: 1rem;
      }
      
      .gallery-tags {
        margin-top: 1rem;
      }
      
      .gallery-tags .tag {
        background: #f0f0f0;
        padding: 0.25rem 0.5rem;
        margin-right: 0.5rem;
        border-radius: 4px;
        font-size: 0.8rem;
        color: #666;
      }
      
      .no-galleries {
        text-align: center;
        padding: 4rem 2rem;
        color: #666;
      }
      
      .no-galleries h2 {
        margin-bottom: 1rem;
      }
      
      @media (max-width: 768px) {
        .galleries-container {
          padding: 1rem;
        }
        
        .galleries-header h1 {
          font-size: 2rem;
        }
        
        .gallery-preview {
          padding: 1rem;
        }
      }
    </style>
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
  console.log({ filePath });
  await fs.writeFile(filePath, htmlContent);

  console.log(`Created gallery index with ${galleries.length} galleries`);
}
