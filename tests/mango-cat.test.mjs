import { test } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateCompletePage } from "../builders/generateCompletePage.js";

const projectRoot = path.join(fileURLToPath(import.meta.url), "../..");

// Mango the site cat should appear on every page built through
// generateCompletePage, unless the caller opts out with skipMango.

test("generateCompletePage includes the mango cat by default", () => {
  const page = generateCompletePage({ content: "<p>hello</p>", title: "Test" });
  assert.match(page, /id="mango-cat"/);
});

test("generateCompletePage omits the mango cat when skipMango is true", () => {
  const page = generateCompletePage({
    content: "<p>hello</p>",
    title: "Test",
    skipMango: true,
  });
  assert.doesNotMatch(page, /id="mango-cat"/);
});

// Mango has exactly one pose: sitting. The curled-up pose was cut.
test("the mango cat include only has the sitting pose", () => {
  const include = fs.readFileSync(
    path.join(projectRoot, "ui/mango.html"),
    "utf-8"
  );
  assert.doesNotMatch(include, /mango-svg-curled|mango-pose-curled/);
});

// Mango belongs on every main page (home, posts, blog index, galleries, 404)
// and nowhere else (menu, album tracker, unbuilt pages). This runs the real
// build and checks the output, because several builders have their own page
// templates and each one has to opt in.
test(
  "the built site has mango on main pages and not on excluded pages",
  { timeout: 60000 },
  () => {
    execSync("node build.js", { cwd: projectRoot, stdio: "pipe" });
    const dist = path.join(projectRoot, "dist");
    const mangoIn = (file) =>
      fs.readFileSync(path.join(dist, file), "utf-8").includes('id="mango-cat"');

    // Find a real blog post file (dist/blog/YYYY/MM/DD/slug, no extension)
    const blogDir = path.join(dist, "blog");
    const year = fs
      .readdirSync(blogDir)
      .filter((f) => /^\d{4}$/.test(f))
      .sort()
      .pop();
    const month = fs.readdirSync(path.join(blogDir, year)).sort().pop();
    const day = fs.readdirSync(path.join(blogDir, year, month)).sort().pop();
    const postFile = fs.readdirSync(path.join(blogDir, year, month, day))[0];
    const postPath = path.join("blog", year, month, day, postFile);

    // Find a real gallery page (dist/photos/<gallery>/index.html)
    const galleryDir = fs
      .readdirSync(path.join(dist, "photos"), { withFileTypes: true })
      .find((d) => d.isDirectory()).name;
    const galleryPath = path.join("photos", galleryDir, "index.html");

    const pagesWithMango = [
      "index.html",
      "404.html",
      "blog/index.html",
      postPath,
      "photos/index.html",
      galleryPath,
    ];
    for (const page of pagesWithMango) {
      assert.ok(mangoIn(page), `expected mango on ${page}`);
    }

    const pagesWithoutMango = [
      "menu.html",
      "album-tracker/index.html",
      "scrum-poker/index.html",
      "joe-study/index.html",
      "fallbright-tips.html",
    ];
    for (const page of pagesWithoutMango) {
      assert.ok(!mangoIn(page), `expected no mango on ${page}`);
    }
  }
);
