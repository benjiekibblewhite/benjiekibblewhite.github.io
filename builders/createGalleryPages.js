import fs from "fs-extra";
import path from "path";
import { marked, outputDir } from "../utils/index.js";
import fm from "front-matter";

export async function createGalleryPages(header, sharedHead) {
  const photosDir = path.join(process.cwd(), "photos");

  if (!(await fs.pathExists(photosDir))) {
    console.log("No photos directory found, skipping gallery creation");
    return [];
  }

  const galleryFolders = await fs.readdir(photosDir);
  const galleries = [];

  for (const folder of galleryFolders) {
    const folderPath = path.join(photosDir, folder);
    const stat = await fs.stat(folderPath);

    if (!stat.isDirectory()) continue;

    const indexPath = path.join(folderPath, "index.md");
    if (!(await fs.pathExists(indexPath))) continue;

    // Read the index.md file to get metadata
    const indexContent = await fs.readFile(indexPath, "utf-8");
    const { attributes, body } = fm(indexContent);

    // const { attributes, content } = parseMarkdown(indexContent);

    // Get all image files in the folder
    const files = await fs.readdir(folderPath);
    const imageFiles = files.filter(
      (file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file) && file !== "index.md"
    );

    if (imageFiles.length === 0) continue;

    // Create photo objects with optimized and original paths
    const photos = imageFiles.map((filename) => ({
      filename,
      originalPath: `/photos/${folder}/${filename}`,
      optimizedPath: `/static/optimized/${folder}/${filename.replace(
        /\.(jpg|jpeg|png|gif)$/i,
        ".webp"
      )}`,
    }));

    // Create gallery URL
    const galleryUrl = `/photos/${folder}`;
    console.log(attributes);
    // Generate HTML content
    const htmlContent = generateGalleryHTML({
      title: attributes.title || folder,
      date:
        new Date(attributes.date).toDateString() ||
        new Date().toISOString().split("T")[0],
      tags: attributes.tags || [],
      description: marked.parse(body),
      photos,
      photosJson: JSON.stringify(photos),
      header,
      sharedHead,
    });

    // Create output directory
    const outputPath = path.join(outputDir, "photos", folder);
    await fs.ensureDir(outputPath);

    // Write the HTML file
    await fs.writeFile(path.join(outputPath, "index.html"), htmlContent);

    galleries.push({
      title: attributes.title || folder,
      date:
        new Date(attributes.date).toDateString() ||
        new Date().toISOString().split("T")[0],
      url: galleryUrl,
      folder,
      photoCount: photos.length,
      photos: photos,
      tags: attributes.tags || [],
    });
  }

  return galleries;
}

// function parseMarkdown(content) {
//   // Simple frontmatter parser
//   const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
//   const match = content.match(frontmatterRegex);

//   if (!match) {
//     return { attributes: {}, content };
//   }

//   const [, frontmatter, markdownContent] = match;
//   const attributes = {};

//   // Parse YAML-like frontmatter
//   const lines = frontmatter.split("\n");
//   for (const line of lines) {
//     const colonIndex = line.indexOf(":");
//     if (colonIndex === -1) continue;

//     const key = line.substring(0, colonIndex).trim();
//     let value = line.substring(colonIndex + 1).trim();

//     // Remove quotes if present
//     if (
//       (value.startsWith('"') && value.endsWith('"')) ||
//       (value.startsWith("'") && value.endsWith("'"))
//     ) {
//       value = value.slice(1, -1);
//     }

//     // Handle arrays (tags, categories)
//     if (value.startsWith("[") && value.endsWith("]")) {
//       value = value
//         .slice(1, -1)
//         .split(",")
//         .map((item) => item.trim().replace(/^["']|["']$/g, ""));
//     }

//     attributes[key] = value;
//   }

//   return { attributes, content: markdownContent };
// }

function generateGalleryHTML({
  title,
  date,
  tags,
  description,
  photos,
  photosJson,
  header,
  sharedHead,
}) {
  const sharedHeadContent = sharedHead;

  let tagsHtml = "";
  if (tags && tags.length > 0) {
    tagsHtml = tags.map((tag) => `<span>${tag}</span>`).join("");
  }

  let photosHtml = "";
  if (photos && photos.length > 0) {
    photosHtml = photos
      .map(
        (photo, index) => `
      <div class="photo-item" onclick="openModal(${index})">
        <img src="${photo.optimizedPath}" alt="${photo.filename}" loading="lazy">
        <div class="filename">${photo.filename}</div>
      </div>
    `
      )
      .join("");
  }

  return `<!DOCTYPE html>
<html lang="en">
  ${sharedHeadContent.replace(
    "<head>",
    `<head>\n    <title>${title} - Gallery</title>`
  )}
     <link rel="stylesheet" href="/static/gallery.css" />
  </head>
  <body>
    ${header}
    <main>
      <div class="gallery-container">
        <div class="gallery-info">
          <h1>${title}</h1>
          <div class="date">${date}</div>
          <div class="gallery-tags">
            ${tagsHtml}
          </div>
          <div class="description">${description}</div>
        </div>
        
        <div class="gallery-photos">
          <div class="photo-grid">
            ${photosHtml}
          </div>
        </div>
      </div>
    </main>
    
    <!-- Modal -->
    <div id="photoModal" class="modal">
      <div class="modal-content">
        <button aria-label="Close gallery window" class="modal-close" onclick="closeModal()"><svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></button>
        <button aria-label="View previous image" class="modal-controls modal-prev" onclick="previousPhoto()"><svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#e3e3e3"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg></button>
        <img id="modalImage" src="" alt="">
        <button aria-label="View next image" class="modal-controls modal-next" onclick="nextPhoto()"><svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#e3e3e3"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></button>
        <div class="modal-info">
          <div class="modal-filename" id="modalFilename"></div>
        </div>
      </div>
    </div>
    
    <script>
      let currentPhotoIndex = 0;
      const photos = ${photosJson};
      
      function openModal(index) {
        currentPhotoIndex = index;
        updateModal();
        document.getElementById('photoModal').classList.add('active');
        document.body.style.overflow = 'hidden';
      }
      
      function closeModal() {
        document.getElementById('photoModal').classList.remove('active');
        document.body.style.overflow = 'auto';
      }
      
      function updateModal() {
        const photo = photos[currentPhotoIndex];
        document.getElementById('modalImage').src = photo.optimizedPath;
        document.getElementById('modalImage').alt = photo.filename;
        document.getElementById('modalFilename').textContent = photo.filename;
        // document.getElementById('modalOriginalLink').href = photo.originalPath;
        
        // Update navigation button visibility
        const prevBtn = document.querySelector('.modal-prev');
        const nextBtn = document.querySelector('.modal-next');
        
        prevBtn.style.display = photos.length > 1 ? 'flex' : 'none';
        nextBtn.style.display = photos.length > 1 ? 'flex' : 'none';
      }
      
      function previousPhoto() {
        if (photos.length <= 1) return;
        currentPhotoIndex = (currentPhotoIndex - 1 + photos.length) % photos.length;
        updateModal();
      }
      
      function nextPhoto() {
        if (photos.length <= 1) return;
        currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
        updateModal();
      }
      
      // Keyboard navigation
      document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('photoModal');
        if (!modal.classList.contains('active')) return;
        
        switch(e.key) {
          case 'Escape':
            closeModal();
            break;
          case 'ArrowLeft':
            previousPhoto();
            break;
          case 'ArrowRight':
            nextPhoto();
            break;
        }
      });
      
      // Close modal when clicking outside
      document.getElementById('photoModal').addEventListener('click', function(e) {
        if (e.target === this) {
          closeModal();
        }
      });
    </script>
  </body>
</html>`;
}
