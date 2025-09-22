import path from "path";
import fs from "fs-extra";
import { __dirname, outputDir } from "../utils/index.js";
import { generateCompletePage } from "./index.js";

export async function copyStaticFiles(header, sharedHead) {
  // Copy pages directory to dist if it exists
  const pagesDir = path.join(__dirname, "../pages");
  const staticDir = path.join(__dirname, "../static");
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
  const unbuiltPagesDir = path.join(__dirname, "../unbuilt-pages");
  if (await fs.pathExists(unbuiltPagesDir)) {
    const unbuiltFiles = await fs.readdir(unbuiltPagesDir);
    console.log(unbuiltFiles);
    for (const file of unbuiltFiles) {
      const filePath = path.join(unbuiltPagesDir, file);
      await fs.copy(filePath, path.join(outputDir, file), {
        overwrite: true,
      });
    }
  }

  // Copy menu.html to dist
  const menuFile = path.join(__dirname, "../pages/menu.html");
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
