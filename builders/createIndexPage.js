import { outputDir, POSTS_PER_PAGE, marked } from "../utils/index.js";
import path from "path";
import fs from "fs-extra";

function createPaginationLinks(currentPage, totalPages) {
  let links = [];

  // Add back arrow (inert span at the boundary so it can't be keyboard-focused into a 404)
  if (currentPage === 1) {
    links.push(
      `<span class="pagination-arrow disabled" aria-hidden="true">&larr;</span>`
    );
  } else {
    const prevPage = currentPage - 1;
    const filename = prevPage === 1 ? "index.html" : `page${prevPage}.html`;
    links.push(
      `<a href="/blog/${filename}" class="pagination-arrow" aria-label="Previous page">&larr;</a>`
    );
  }

  // Add page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      links.push(
        `<span class="current-page" aria-current="page">${i}</span>`
      );
    } else {
      const filename = i === 1 ? "index.html" : `page${i}.html`;
      links.push(`<a href="/blog/${filename}">${i}</a>`);
    }
  }

  // Add forward arrow (inert span at the boundary)
  if (currentPage === totalPages) {
    links.push(
      `<span class="pagination-arrow disabled" aria-hidden="true">&rarr;</span>`
    );
  } else {
    const nextPage = currentPage + 1;
    links.push(
      `<a href="/blog/page${nextPage}.html" class="pagination-arrow" aria-label="Next page">&rarr;</a>`
    );
  }

  return links.join(" ");
}

export async function createPostIndexPages(posts, header, sharedHead) {
  const totalPages = Math.ceil(posts.length / POSTS_PER_PAGE);
  const blogDir = path.join(outputDir, "blog");

  // Ensure blog directory exists
  await fs.ensureDir(blogDir);

  for (let page = 1; page <= totalPages; page++) {
    const startIdx = (page - 1) * POSTS_PER_PAGE;
    const pagePosts = posts.slice(startIdx, startIdx + POSTS_PER_PAGE);

    // Replace placeholder head with dynamic title
    const headContent = sharedHead.replace(
      "<head>",
      `<head>\n  <title>Posts${page > 1 ? ` - Page ${page}` : ""}</title>`
    );

    const indexContent = `<!DOCTYPE html>
  <html lang="en">
    ${headContent}
    <body>
      ${header}
      <main class='blog-page' id="main-content">
        <h1>Posts</h1>
        ${pagePosts
          .map((post) => {
            // Must match the postId formula in createPostsPages.js (view-transition names pair across pages)
            const postId = `${post.fileDate}-${post.title.replace(/[^A-Z0-9]/gi, "")}`;
            return `
                <article class='post-preview'>
                  <h2><a id='${postId}' href="${
              post.url
            }" class='post-link' style="view-transition-name: post-${postId}">${
              post.title
            }</a></h2>
                  <p class="post-meta">${post.displayDate}</p>
                  ${marked.parse(post.preview)}
                </article>
              `;
          })
          .join("\n")}
        <nav class="pagination" aria-label="Pagination">
          ${createPaginationLinks(page, totalPages)}
        </nav>
      </main>
    </body>
  </html>`;

    const filename = page === 1 ? "index.html" : `page${page}.html`;
    await fs.outputFile(path.join(blogDir, filename), indexContent);
  }
}
