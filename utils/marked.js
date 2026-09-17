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
      return `<a href="${href}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
    }
  };
  marked.use({ renderer });
  marked.use(markedSmartypants());

  export default marked;