import { outputDir, POSTS_PER_PAGE, marked } from "../utils/index.js";
import path from "path";
import fs from "fs-extra";

function createPaginationLinks(currentPage, totalPages) {
  let links = [];

  // Add back arrow
  // if (currentPage > 1) {
  const prevPage = currentPage - 1;
  const filename = prevPage === 1 ? "index.html" : `page${prevPage}.html`;
  links.push(
    `<a href="/blog/${filename}" class="pagination-arrow${
      currentPage === 1 ? " disabled" : ""
    }">&larr;</a>`
  );
  // }

  // Add page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      links.push(`<span class="current-page">${i}</span>`);
    } else {
      const filename = i === 1 ? "index.html" : `page${i}.html`;
      links.push(`<a href="/blog/${filename}">${i}</a>`);
    }
  }

  // Add forward arrow
  // if (currentPage < totalPages) {
  const nextPage = currentPage + 1;
  links.push(
    `<a href="/blog/page${nextPage}.html" class="pagination-arrow${
      currentPage === totalPages ? " disabled" : ""
    }">&rarr;</a>`
  );
  // }

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
      `<head>\n  <title>My Blog${page > 1 ? ` - Page ${page}` : ""}</title>`
    );

    const indexContent = `<!DOCTYPE html>
  <html lang="en">
    ${headContent}
    <body>
      ${header}
      <main>
        ${pagePosts
          .map((post) => {
            const postId = post.title.replace(/[^A-Z0-9]/gi, "");
            return `
                <article>
                  <h2><a id='${postId}' href="${
              post.url
            }" class='post-link' style="view-transition-name: post-${postId}">${
              post.title
            }</a></h2>
                  <p>${post.date}</p>
                  <p>${marked.parse(post.preview)}</p>
                </article>
              `;
          })
          .join("\n")}
        <nav class="pagination">
          ${createPaginationLinks(page, totalPages)}
        </nav>
      </main>
    </body>
  </html>`;

    const filename = page === 1 ? "index.html" : `page${page}.html`;
    await fs.outputFile(path.join(blogDir, filename), indexContent);
  }
}
