import fs from "fs-extra";
import path from "path";
import { marked, outputDir } from "../utils/index.js";
import fm from "front-matter";

// Format a gallery date without timezone off-by-one:
// "2026-08-01" parsed as UTC midnight renders as the previous day in the Americas.
function formatGalleryDate(date) {
  if (!date) return "";
  // front-matter parses YAML dates as UTC-midnight Date objects; rebuild
  // from the UTC calendar components so the intended day is what renders
  const d =
    date instanceof Date
      ? new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
      : new Date(`${String(date)}T12:00:00`);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate imageId from filename and index
function generateImageId(title, index) {
  // Remove spaces from title for imageId
  const cleanTitle = title.replace(/\s+/g, "");
  return cleanTitle + "_" + index;
}

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
    const photos = imageFiles.map((filename, index) => {
      const title = filename.replace(/\.[^.]*$/, "");

      return {
        filename,
        title,
        imageId: generateImageId(title, index),
        originalPath: `/photos/${folder}/${filename}`,
        optimizedPath: `/static/optimized/${folder}/${filename.replace(
          /\.(jpg|jpeg|png|gif)$/i,
          ".webp"
        )}`,
      };
    });

    // Create gallery URL
    const galleryUrl = `/photos/${folder}`;
    // Generate HTML content
    const htmlContent = generateGalleryHTML({
      title: attributes.title || folder,
      date: formatGalleryDate(attributes.date),
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
      date: formatGalleryDate(attributes.date),
      url: galleryUrl,
      folder,
      photoCount: photos.length,
      photos: photos,
      tags: attributes.tags || [],
    });
  }

  return galleries;
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
      <button type="button" class="photo-item" aria-label="View photo: ${photo.title}" onclick="openModal(${index})">
        <img src="${photo.optimizedPath}" alt="" loading="lazy">
        <span class="filename">${photo.title}</span>
      </button>
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
    <a href="/photos" class='back-link'><- Back to list</a>
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
    <div id="photoModal" class="modal" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <div class="modal-content">
        <button aria-label="Close gallery window" class="modal-close" onclick="closeModal()"><svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#e3e3e3"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg></button>
        <button aria-label="View previous image" class="modal-controls modal-prev" onclick="previousPhoto()"><svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#e3e3e3"><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z"/></svg></button>
        <img id="modalImage" src="" alt="">
        <button aria-label="View next image" class="modal-controls modal-next" onclick="nextPhoto()"><svg xmlns="http://www.w3.org/2000/svg" height="36px" viewBox="0 -960 960 960" width="36px" fill="#e3e3e3"><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z"/></svg></button>
        <div class="modal-info">
          <div class="modal-filename" id="modalFilename"></div>
          <div class="modal-counter" id="modalCounter" aria-live="polite"></div>
        </div>
      </div>
    </div>
    
    <script>
      let currentPhotoIndex = 0;
      let previouslyFocusedElement = null;
      const photos = ${photosJson};
      
   
      
      // Get imageId from query parameter
      function getImageIdFromQuery() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('openImage');
      }
      
      // Find photo index by imageId
      function findPhotoIndexByImageId(imageId) {
        for (let i = 0; i < photos.length; i++) {
          if (photos[i].imageId === imageId) {
            return i;
          }
        }
        return -1;
      }
      
      function openModal(index) {
        currentPhotoIndex = index;
        previouslyFocusedElement = document.activeElement;
        updateModal();
        document.getElementById('photoModal').classList.add('active');
        document.body.style.overflow = 'hidden';

        // Move focus into the dialog
        document.querySelector('.modal-close').focus();

        // Set query parameter
        const imageId = photos[index].imageId
        const url = new URL(window.location);
        url.searchParams.set('openImage', imageId);
        window.history.pushState({}, '', url);
      }

      function closeModal() {
        document.getElementById('photoModal').classList.remove('active');
        document.body.style.overflow = 'auto';

        // Return focus to the element that opened the dialog
        if (previouslyFocusedElement) {
          previouslyFocusedElement.focus();
          previouslyFocusedElement = null;
        }

        // Remove query parameter
        const url = new URL(window.location);
        url.searchParams.delete('openImage');
        window.history.pushState({}, '', url);
      }
      
      function updateModal() {
        const photo = photos[currentPhotoIndex];
        document.getElementById('modalImage').src = photo.optimizedPath;
        // alt stays empty: the visible filename caption below labels the image
        document.getElementById('modalFilename').textContent = photo.title;
        document.getElementById('modalCounter').textContent = (currentPhotoIndex + 1) + ' of ' + photos.length;
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
        
        // Update query parameter
        const imageId = photos[currentPhotoIndex].imageId;
        const url = new URL(window.location);
        url.searchParams.set('openImage', imageId);
        window.history.pushState({}, '', url);
      }
      
      function nextPhoto() {
        if (photos.length <= 1) return;
        currentPhotoIndex = (currentPhotoIndex + 1) % photos.length;
        updateModal();
        
        // Update query parameter
        const imageId = photos[currentPhotoIndex].imageId;
        const url = new URL(window.location);
        url.searchParams.set('openImage', imageId);
        window.history.pushState({}, '', url);
      }
      
      // Keyboard navigation
      document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('photoModal');
        if (!modal.classList.contains('active')) return;

        // Trap Tab within the dialog
        if (e.key === 'Tab') {
          const focusable = Array.from(modal.querySelectorAll('button')).filter(
            (btn) => btn.offsetParent !== null
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          } else if (!modal.contains(document.activeElement)) {
            e.preventDefault();
            first.focus();
          }
          return;
        }

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
      
      // Check for openImage query parameter on page load
      document.addEventListener('DOMContentLoaded', function() {
        const imageId = getImageIdFromQuery();
        if (imageId) {
          const photoIndex = findPhotoIndexByImageId(imageId);
          if (photoIndex !== -1) {
            openModal(photoIndex);
          }
        }
      });
      
      // Handle browser back/forward button navigation
      window.addEventListener('popstate', function() {
        const imageId = getImageIdFromQuery();
        if (imageId) {
          const photoIndex = findPhotoIndexByImageId(imageId);
          if (photoIndex !== -1) {
            currentPhotoIndex = photoIndex;
            updateModal();
            document.getElementById('photoModal').classList.add('active');
            document.body.style.overflow = 'hidden';
          }
        } else {
          // No imageId in URL, close modal if open
          if (document.getElementById('photoModal').classList.contains('active')) {
            document.getElementById('photoModal').classList.remove('active');
            document.body.style.overflow = 'auto';
            if (previouslyFocusedElement) {
              previouslyFocusedElement.focus();
              previouslyFocusedElement = null;
            }
          }
        }
      });
    </script>
  </body>
</html>`;
}
