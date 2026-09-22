import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";

// Configure marked for better output and security
marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  
  // Add lazyloading to images in markdown
  // marked v16 passes a single token object: { href, title, text, tokens }
  const renderer = {
    image({ href, title, text }) {
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}"${titleAttr} alt="${text ?? ''}" loading="lazy" decoding="async" />`;
    },
    link({ href, title, tokens }) {
      const text = this.parser.parseInline(tokens);
      const titleAttr = title ? ` title="${title}"` : '';
      // Only true external links open a new tab; internal links stay put so
      // Back keeps working and SR users aren't context-switched without warning
      const isExternal =
        /^https?:\/\//i.test(href) && !href.includes("benjie.ca");
      if (isExternal) {
        return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}<span class="visually-hidden"> (opens in new tab)</span></a>`;
      }
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    },
    code(token) {
      // Scrollable code blocks must be keyboard-focusable (axe: scrollable-region-focusable)
      return marked.Renderer.prototype.code
        .call(this, token)
        .replace("<pre", '<pre tabindex="0"');
    }
  };
  marked.use({ renderer });
  marked.use(markedSmartypants());

  export default marked;