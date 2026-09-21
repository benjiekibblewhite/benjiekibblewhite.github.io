// Create a reusable function to generate complete HTML pages
export function generateCompletePage({
  content = "",
  title = "",
  header = "",
  sharedHead = "",
  skipHeader = false,
  skipMain = false,
  bodyClass = "",
} = {}) {
  const headContent = sharedHead.replace(
    "<head>",
    `<head>\n  <title>${title}</title>`
  );
  const bodyTag = bodyClass ? `<body class="${bodyClass}">` : "<body>";
  if (skipMain) {
    return `<!DOCTYPE html>
          <html lang="en">
            ${headContent}
            ${bodyTag}
              ${skipHeader ? "" : header}
                ${content}
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
    </body>
  </html>`;
}
