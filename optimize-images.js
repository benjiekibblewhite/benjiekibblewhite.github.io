import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STATIC_DIR = path.join(__dirname, "static");
const PHOTOS_DIR = path.join(__dirname, "photos");
const OPTIMIZED_DIR = path.join(STATIC_DIR, "optimized");
// Change output directory to be the same as input directory
const OUTPUT_DIR = STATIC_DIR;

// Create temporary directory for processing
const TEMP_DIR = path.join(__dirname, "temp_img_process");

export function optimizeImages() {}
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Ensure optimized directory exists
if (!fs.existsSync(OPTIMIZED_DIR)) {
  fs.mkdirSync(OPTIMIZED_DIR, { recursive: true });
}

// Get all image files from the static directory
const imageFiles = fs.readdirSync(STATIC_DIR).filter((file) => {
  const ext = path.extname(file).toLowerCase();
  return (
    [".png", ".jpg", ".jpeg", ".gif"].includes(ext) && !file.startsWith(".")
  );
});

console.log(`Found ${imageFiles.length} images to process...`);

// Function to process gallery photos
async function processGalleryPhotos() {
  if (!fs.existsSync(PHOTOS_DIR)) {
    console.log("No photos directory found, skipping gallery photo processing");
    return;
  }

  const galleryFolders = fs.readdirSync(PHOTOS_DIR).filter((item) => {
    const itemPath = path.join(PHOTOS_DIR, item);
    return fs.statSync(itemPath).isDirectory();
  });

  console.log(`Found ${galleryFolders.length} gallery folders to process...`);

  for (const folder of galleryFolders) {
    const folderPath = path.join(PHOTOS_DIR, folder);
    const imageFiles = fs.readdirSync(folderPath).filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return (
        [".png", ".jpg", ".jpeg", ".gif"].includes(ext) && file !== "index.md"
      );
    });

    if (imageFiles.length === 0) continue;

    console.log(`Processing ${imageFiles.length} images in gallery: ${folder}`);

    // Create optimized directory for this gallery
    const galleryOptimizedDir = path.join(OPTIMIZED_DIR, folder);
    if (!fs.existsSync(galleryOptimizedDir)) {
      fs.mkdirSync(galleryOptimizedDir, { recursive: true });
    }

    for (const file of imageFiles) {
      const inputPath = path.join(folderPath, file);
      const fileBaseName = path.basename(file, path.extname(file));
      const tempWebPPath = path.join(TEMP_DIR, `${fileBaseName}.webp`);
      const finalWebPPath = path.join(
        galleryOptimizedDir,
        `${fileBaseName}.webp`
      );
      const stats = fs.statSync(inputPath);
      const fileSizeInKB = stats.size / 1024;

      console.log(
        `Processing gallery photo ${folder}/${file} (${fileSizeInKB.toFixed(
          2
        )} KB)...`
      );

      try {
        // Get image metadata first
        const metadata = await sharp(inputPath).metadata();
        const { width, height } = metadata;

        // Calculate new dimensions to maintain aspect ratio
        // Only resize if larger than 1200px wide (adjust as needed)
        let newWidth = width;
        let newHeight = height;

        if (width > 1200) {
          newWidth = 1200;
          newHeight = Math.round((height / width) * newWidth);
        }

        // Convert to WebP with quality optimization
        await sharp(inputPath)
          .resize(newWidth, newHeight)
          .webp({ quality: 85 })
          .toFile(tempWebPPath);

        // Get stats on the optimized file
        const webpStats = fs.statSync(tempWebPPath);
        const webpFileSizeInKB = webpStats.size / 1024;
        const webpSavingsPercent = (
          ((fileSizeInKB - webpFileSizeInKB) / fileSizeInKB) *
          100
        ).toFixed(2);

        // Move the optimized file to the optimized directory
        fs.copyFileSync(tempWebPPath, finalWebPPath);

        console.log(
          `✅ Converted ${folder}/${file} to WebP. Original: ${fileSizeInKB.toFixed(
            2
          )} KB, WebP: ${webpFileSizeInKB.toFixed(
            2
          )} KB (${webpSavingsPercent}% savings)`
        );
        console.log(
          `   Dimensions: ${width}x${height} → ${newWidth}x${newHeight}`
        );
      } catch (error) {
        console.error(`❌ Error processing ${folder}/${file}:`, error);
      }
    }
  }
}

// Process gallery photos first
await processGalleryPhotos();

// Process each image
imageFiles.forEach(async (file) => {
  const inputPath = path.join(STATIC_DIR, file);
  const fileBaseName = path.basename(file, path.extname(file));
  const tempWebPPath = path.join(TEMP_DIR, `${fileBaseName}.webp`);
  const finalWebPPath = path.join(OUTPUT_DIR, `${fileBaseName}.webp`);
  const stats = fs.statSync(inputPath);
  const fileSizeInKB = stats.size / 1024;

  console.log(`Processing ${file} (${fileSizeInKB.toFixed(2)} KB)...`);

  try {
    // Get image metadata first
    const metadata = await sharp(inputPath).metadata();
    const { width, height } = metadata;

    // Calculate new dimensions to maintain aspect ratio
    // Only resize if larger than 1200px wide (adjust as needed)
    let newWidth = width;
    let newHeight = height;

    if (width > 1200) {
      newWidth = 1200;
      newHeight = Math.round((height / width) * newWidth);
    }

    // Convert to WebP with quality optimization
    await sharp(inputPath)
      .resize(newWidth, newHeight)
      .webp({ quality: 85 })
      .toFile(tempWebPPath);

    // Also optimize the original format image
    const tempOptimizedPath = path.join(TEMP_DIR, file);
    await sharp(inputPath)
      .resize(newWidth, newHeight)
      .toFile(tempOptimizedPath);

    // Get stats on the optimized files
    const webpStats = fs.statSync(tempWebPPath);
    const webpFileSizeInKB = webpStats.size / 1024;
    const webpSavingsPercent = (
      ((fileSizeInKB - webpFileSizeInKB) / fileSizeInKB) *
      100
    ).toFixed(2);

    const optimizedStats = fs.statSync(tempOptimizedPath);
    const optimizedSizeInKB = optimizedStats.size / 1024;
    const origSavingsPercent = (
      ((fileSizeInKB - optimizedSizeInKB) / fileSizeInKB) *
      100
    ).toFixed(2);

    // Move the optimized files back to the static directory
    fs.copyFileSync(tempWebPPath, finalWebPPath);
    fs.copyFileSync(tempOptimizedPath, inputPath); // Replace original file with optimized version

    console.log(
      `✅ Converted ${file} to WebP. Original: ${fileSizeInKB.toFixed(
        2
      )} KB, WebP: ${webpFileSizeInKB.toFixed(
        2
      )} KB (${webpSavingsPercent}% savings)`
    );
    console.log(
      `✅ Optimized ${file}. Original: ${fileSizeInKB.toFixed(
        2
      )} KB, Optimized: ${optimizedSizeInKB.toFixed(
        2
      )} KB (${origSavingsPercent}% savings)`
    );
    console.log(`   Dimensions: ${width}x${height} → ${newWidth}x${newHeight}`);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error);
  }
});

// Also handle any WebP files that already exist but might need resizing
const webpFiles = fs.readdirSync(STATIC_DIR).filter((file) => {
  return path.extname(file).toLowerCase() === ".webp" && !file.startsWith(".");
});

webpFiles.forEach(async (file) => {
  const inputPath = path.join(STATIC_DIR, file);
  const tempPath = path.join(TEMP_DIR, file);
  const stats = fs.statSync(inputPath);
  const fileSizeInKB = stats.size / 1024;

  console.log(
    `Processing existing WebP ${file} (${fileSizeInKB.toFixed(2)} KB)...`
  );

  try {
    const metadata = await sharp(inputPath).metadata();
    const { width, height } = metadata;

    let newWidth = width;
    let newHeight = height;

    if (width > 1200) {
      newWidth = 1200;
      newHeight = Math.round((height / width) * newWidth);
    }

    // Optimize existing WebP file
    await sharp(inputPath)
      .resize(newWidth, newHeight)
      .webp({ quality: 85 })
      .toFile(tempPath);

    const optimizedStats = fs.statSync(tempPath);
    const optimizedSizeInKB = optimizedStats.size / 1024;
    const savingsPercent = (
      ((fileSizeInKB - optimizedSizeInKB) / fileSizeInKB) *
      100
    ).toFixed(2);

    // Replace original WebP with optimized version
    fs.copyFileSync(tempPath, inputPath);

    console.log(
      `✅ Optimized ${file}. Original: ${fileSizeInKB.toFixed(
        2
      )} KB, Optimized: ${optimizedSizeInKB.toFixed(
        2
      )} KB (${savingsPercent}% savings)`
    );
    console.log(`   Dimensions: ${width}x${height} → ${newWidth}x${newHeight}`);
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error);
  }
});

// Clean up temporary directory after processing
setTimeout(() => {
  if (fs.existsSync(TEMP_DIR)) {
    try {
      fs.rmSync(TEMP_DIR, { recursive: true, force: true });
      console.log("Temporary processing directory cleaned up.");
    } catch (error) {
      console.error("Error cleaning up temporary directory:", error);
    }
  }
}, 10000); // Give a 10-second delay to ensure all async operations complete

console.log(
  "Image optimization complete! Original images have been replaced with optimized versions."
);
console.log("WebP versions have also been created in the static directory.");
console.log(
  "Gallery photos have been processed and optimized WebP versions created in static/optimized/"
);
console.log(
  "No HTML changes needed - your existing image references will use the optimized versions."
);
