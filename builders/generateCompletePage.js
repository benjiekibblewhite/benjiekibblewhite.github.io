import { getMangoCatInclude } from "./mangoCat.js";

// Create a reusable function to generate complete HTML pages.
// Every page gets Mango the site cat (see builders/mangoCat.js) unless the
// caller passes skipMango: true — currently just the menu.
export function generateCompletePage({
  content = "",
  title = "",
  header = "",
  sharedHead = "",
  skipHeader = false,
  skipMain = false,
  skipMango = false,
  bodyClass = "",
} = {}) {
  const headContent = sharedHead.replace(
    "<head>",
    `<head>\n  <title>${title}</title>`
  );
  const bodyTag = bodyClass ? `<body class="${bodyClass}">` : "<body>";
  const mango = skipMango ? "" : getMangoCatInclude();
  if (skipMain) {
    return `<!DOCTYPE html>
          <html lang="en">
            ${headContent}
            ${bodyTag}
              ${skipHeader ? "" : header}
                ${content}
              ${mango}
            </body>
          </html>`;
  }
  return `<!DOCTYPE html>
  <html lang="en">
    ${headContent}
    ${bodyTag}
      ${skipHeader ? "" : header}
      <main id="main-content">
        ${content}
      </main>
      ${mango}
    </body>
  </html>`;
}
