
// Create a reusable function to generate complete HTML pages
export function generateCompletePage({
    content = "",
    title = "",
    header = "",
    sharedHead = "",
    skipHeader = false,
    skipMain = false,
  } = {}) {
    const headContent = sharedHead.replace(
      "<head>",
      `<head>\n  <title>${title}</title>`
    );
    if (skipMain) {
      return `<!DOCTYPE html>
          <html lang="en">
            ${headContent}
            <body>
              ${skipHeader ? "" : header}
                ${content}
            </body>
          </html>`;
    }
    return `<!DOCTYPE html>
  <html lang="en">
    ${headContent}
    <body>
      ${skipHeader ? "" : header}
      <main>
        ${content}
      </main>
    </body>
  </html>`;
  }
  