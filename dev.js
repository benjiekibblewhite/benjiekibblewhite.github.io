const express = require("express");
const chokidar = require("chokidar");
const { exec } = require("child_process");
const path = require("path");
const livereload = require("livereload");
const connectLivereload = require("connect-livereload");
const open = require("open");

const app = express();
const PORT = 3000;
const DIST_DIR = path.join(__dirname, "dist");

// Enable live reload
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(DIST_DIR);
app.use(connectLivereload());

// Serve static files from the dist directory
app.use(express.static(DIST_DIR));

// Watch for changes in the source files
const watcher = chokidar.watch(["posts", "pages", "ui", "static", "build.js"], {
  ignored: /(^|[\/\\])\../, // Ignore dotfiles
  persistent: true,
});

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
  exec("node build.js", (err, stdout, stderr) => {
    if (err) {
      console.error(`Error during initial build: ${stderr}`);
    } else {
      console.log(stdout);
      app.listen(PORT, async () => {
        console.log(`Dev server running at http://localhost:${PORT}`);
        await open(`http://localhost:${PORT}`);
      });
    }
  });
})();
