const fs = require("fs-extra");
const path = require("path");
const fm = require("front-matter");
const marked = require("marked");

const postsDir = path.join(__dirname, "posts");
const outputDir = path.join(__dirname, "dist");
const POSTS_PER_PAGE = 5;

async function copyStaticFiles() {
  // Copy pages directory to dist if it exists
  const pagesDir = path.join(__dirname, "pages");
  if (await fs.pathExists(pagesDir)) {
    await fs.copy(pagesDir, outputDir, { overwrite: true });
  }

  // Copy menu.html to dist
  const menuFile = path.join(__dirname, "ui/menu.html");
  if (await fs.pathExists(menuFile)) {
    await fs.copy(menuFile, path.join(outputDir, "menu.html"));
  }
}

async function getAllPosts() {
  const files = await fs.readdir(postsDir);
  const posts = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;

    const dateMatch = file.match(/^(\d{4}-\d{2}-\d{2})/);
    const fileDate = dateMatch ? dateMatch[1] : null;

    const filePath = path.join(postsDir, file);
    const content = await fs.readFile(filePath, "utf-8");
    const { attributes, body } = fm(content);

    // Find first text paragraph (skip images, code blocks, etc)
    const firstParagraph =
      body
        .split("\n")
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 0 &&
            !line.startsWith("![") && // skip images
            !line.startsWith("```") && // skip code blocks
            !line.startsWith("#") // skip headers
        )[0] || "";

    posts.push({
      title: attributes.title,
      date: attributes.date,
      preview: firstParagraph.substring(0, 150) + "...",
      filename: file.replace(".md", ".html"),
      content: body,
      attributes,
      fileDate,
    });
  }

  return posts.sort((a, b) => {
    if (!a.fileDate || !b.fileDate) return 0;
    return new Date(b.fileDate) - new Date(a.fileDate);
  });
}

async function createPostPages(posts) {
  const header = await fs.readFile(
    path.join(__dirname, "ui/header.html"),
    "utf-8"
  );

  for (const post of posts) {
    const htmlContent = `
      <html>
        <head>
          <title>${post.title}</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          ${header}
          <h1>${post.title}</h1>
          <p>${post.date}</p>
          <div>${marked.parse(post.content)}</div>
          <p>by ${post.attributes.author}</p>
          <p>Tags: ${post.attributes.tags?.join(", ") || "None"}</p>
        </body>
      </html>
    `;

    const outputFilePath = path.join(outputDir, post.filename);
    await fs.outputFile(outputFilePath, htmlContent);
  }
}

function createPaginationLinks(currentPage, totalPages) {
  let links = [];

  // Add back arrow
  if (currentPage > 1) {
    const prevPage = currentPage - 1;
    const filename = prevPage === 1 ? "index.html" : `page${prevPage}.html`;
    links.push(`<a href="/${filename}" class="pagination-arrow">&larr;</a>`);
  }

  // Add page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      links.push(`<span class="current-page">${i}</span>`);
    } else {
      const filename = i === 1 ? "index.html" : `page${i}.html`;
      links.push(`<a href="/${filename}">${i}</a>`);
    }
  }

  // Add forward arrow
  if (currentPage < totalPages) {
    const nextPage = currentPage + 1;
    links.push(
      `<a href="/page${nextPage}.html" class="pagination-arrow">&rarr;</a>`
    );
  }

  return links.join(" ");
}

async function createIndexPages(posts) {
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const header = await fs.readFile(
    path.join(__dirname, "ui/header.html"),
    "utf-8"
  );

  for (let page = 1; page <= totalPages; page++) {
    const startIdx = (page - 1) * POSTS_PER_PAGE;
    const pagePosts = posts.slice(startIdx, startIdx + POSTS_PER_PAGE);

    const indexContent = `
      <html>
        <head>
          <title>My Blog${page > 1 ? ` - Page ${page}` : ""}</title>
          <link rel="stylesheet" href="/styles.css">
        </head>
        <body>
          ${header}
          <h1>Recent Posts</h1>
          ${pagePosts
            .map(
              (post) => `
            <article>
              <h2><a href="/${post.filename}">${post.title}</a></h2>
              <p>${post.date}</p>
              <p>${post.preview}</p>
            </article>
          `
            )
            .join("\n")}
          <nav class="pagination">
            ${createPaginationLinks(page, totalPages)}
          </nav>
        </body>
      </html>
    `;

    const filename = page === 1 ? "index.html" : `page${page}.html`;
    await fs.outputFile(path.join(outputDir, filename), indexContent);
  }
}

async function buildSite() {
  const posts = await getAllPosts();
  await Promise.all([
    createPostPages(posts),
    createIndexPages(posts),
    copyStaticFiles(),
  ]);
}

buildSite().then(() => console.log("Site built!"));
