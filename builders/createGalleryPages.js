import fs from "fs-extra";
import path from "path";
import { marked, outputDir } from "../utils/index.js";

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
    const { attributes, content } = parseMarkdown(indexContent);

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

    // Generate HTML content
    const htmlContent = generateGalleryHTML({
      title: attributes.title || folder,
      date: attributes.date || new Date().toISOString().split("T")[0],
      tags: attributes.tags || [],
      description: marked.parse(content),
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
      date: attributes.date || new Date().toISOString().split("T")[0],
      url: galleryUrl,
      folder,
      photoCount: photos.length,
      tags: attributes.tags || [],
    });
  }

  return galleries;
}

function parseMarkdown(content) {
  // Simple frontmatter parser
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { attributes: {}, content };
  }

  const [, frontmatter, markdownContent] = match;
  const attributes = {};

  // Parse YAML-like frontmatter
  const lines = frontmatter.split("\n");
  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    let value = line.substring(colonIndex + 1).trim();

    // Remove quotes if present
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    // Handle arrays (tags, categories)
    if (value.startsWith("[") && value.endsWith("]")) {
      value = value
        .slice(1, -1)
        .split(",")
        .map((item) => item.trim().replace(/^["']|["']$/g, ""));
    }

    attributes[key] = value;
  }

  return { attributes, content: markdownContent };
}

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
    
    <style>
      .gallery-container {
        display: flex;
        gap: 2rem;
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
      }
      
      .gallery-info {
        flex: 0 0 300px;
      }
      
      .gallery-photos {
        flex: 1;
      }
      
      .gallery-info h1 {
        margin-bottom: 1rem;
        font-size: 2rem;
      }
      
      .gallery-info .date {
        color: #666;
        margin-bottom: 1rem;
      }
      
      .gallery-info .tags {
        margin-bottom: 1rem;
      }
      
      .gallery-info .tags span {
        background: #f0f0f0;
        padding: 0.25rem 0.5rem;
        margin-right: 0.5rem;
        border-radius: 4px;
        font-size: 0.9rem;
      }
      
      .gallery-info .description {
        line-height: 1.6;
      }
      
      .photo-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;
      }
      
      .photo-item {
        position: relative;
        cursor: pointer;
        overflow: hidden;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        transition: transform 0.2s ease;
      }
      
      .photo-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      
      .photo-item img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
      }
      
      .photo-item .filename {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
        color: white;
        padding: 1rem 0.5rem 0.5rem;
        font-size: 0.8rem;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .photo-item:hover .filename {
        opacity: 1;
      }
      
      /* Modal styles */
      .modal {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        z-index: 1000;
        align-items: center;
        justify-content: center;
      }
      
      .modal.active {
        display: flex;
      }
      
      .modal-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      
      .modal img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
      }
      
      .modal-info {
        color: white;
        text-align: center;
        margin-top: 1rem;
      }
      
      .modal-filename {
        font-size: 1.2rem;
        margin-bottom: 0.5rem;
      }
      
      .modal-controls {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        font-size: 2rem;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease;
      }
      
      .modal-controls:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .modal-prev {
        left: 20px;
      }
      
      .modal-next {
        right: 20px;
      }
      
      .modal-close {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: white;
        font-size: 2rem;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .modal-close:hover {
        background: rgba(255,255,255,0.2);
      }
      
      .modal-original-link {
        color: #58aceb;
        text-decoration: none;
        margin-top: 0.5rem;
        display: inline-block;
      }
      
      .modal-original-link:hover {
        text-decoration: underline;
      }
      
      @media (max-width: 768px) {
        .gallery-container {
          flex-direction: column;
          padding: 1rem;
        }
        
        .gallery-info {
          flex: none;
        }
        
        .photo-grid {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        }
        
        .photo-item img {
          height: 150px;
        }
        
        .modal-controls {
          width: 50px;
          height: 50px;
          font-size: 1.5rem;
        }
        
        .modal-prev {
          left: 10px;
        }
        
        .modal-next {
          right: 10px;
        }
      }
    </style>
  </head>
  <body>
    ${header}
    <main>
      <div class="gallery-container">
        <div class="gallery-info">
          <h1>${title}</h1>
          <div class="date">${date}</div>
          <div class="tags">
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
        <button class="modal-close" onclick="closeModal()">&times;</button>
        <button class="modal-controls modal-prev" onclick="previousPhoto()">‹</button>
        <img id="modalImage" src="" alt="">
        <button class="modal-controls modal-next" onclick="nextPhoto()">›</button>
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
