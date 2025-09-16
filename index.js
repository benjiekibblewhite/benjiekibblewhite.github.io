import express from "express";
import chokidar from "chokidar";
import { buildSite } from "./build.js";

const app = express();
const PORT = 3000;

app.use(express.static("dist"));

const watcher = chokidar.watch("posts/*.md");
watcher.on("change", async () => {
  console.log("Changes detected, rebuilding site...");
  await buildSite();
});

app.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
});
