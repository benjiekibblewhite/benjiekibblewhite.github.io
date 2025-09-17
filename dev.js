import express from "express";
import chokidar from "chokidar";
import { exec } from "child_process";
import path from "path";
import livereload from "livereload";
import connectLivereload from "connect-livereload";
import open from "open";
import net from "net";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3000;
const MAX_PORT = 3010; // Try ports between 3000 and 3010
const DIST_DIR = path.join(__dirname, "dist");

// Check if a port is in use
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net
      .createServer()
      .once("error", () => resolve(true))
      .once("listening", () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

// Find an available port
async function findAvailablePort(startPort, maxPort) {
  let port = startPort;
  while (port <= maxPort) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
    port++;
  }
  throw new Error(
    `No available ports found between ${startPort} and ${maxPort}`
  );
}

// Enable live reload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(DIST_DIR);
app.use(connectLivereload());

// Serve static files from the dist directory
app.use(express.static(DIST_DIR));

// Watch for changes in the source files
const watcher = chokidar.watch(
  ["posts", "pages", "ui", "static", "build.js", "builders", "utils"],
  {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
  }
);

// Rebuild the site on file changes
watcher.on("change", (filePath) => {
  console.log(`File changed: ${filePath}`);
  console.log("Rebuilding site...");
  exec("node build.js", (err, stdout, stderr) => {
    if (err) {
      console.error(`Error during build: ${stderr}`);
    } else {
      console.log(stdout);
      liveReloadServer.refresh("/");
    }
  });
});

// Start the development server
(async () => {
  console.log("Building site...");
  exec("node build.js", async (err, stdout, stderr) => {
    if (err) {
      console.error(`Error during initial build: ${stderr}`);
    } else {
      console.log(stdout);
      try {
        const availablePort = await findAvailablePort(PORT, MAX_PORT);
        app.listen(availablePort, async () => {
          console.log(
            `Dev server running at http://localhost:${availablePort}`
          );
          await open(`http://localhost:${availablePort}`);
        });
      } catch (error) {
        console.error(error.message);
      }
    }
  });
})();
