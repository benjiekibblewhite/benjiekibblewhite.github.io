import { marked } from "marked";
import { markedSmartypants } from "marked-smartypants";

// Configure marked for better output and security
marked.setOptions({
    gfm: true,
    breaks: false,
    pedantic: false,
  });
  
  // Add lazyloading to images in markdown
  const renderer = {
    image(href, title, text) {
      const titleAttr = title ? ` title="${title}"` : '';
      const altAttr = text ? ` alt="${text}"` : '';
      return `<img src="${href}"${titleAttr}${altAttr} loading="lazy" decoding="async" />`;
    },
    link(href, title, text) {
      const link = marked.Renderer.prototype.link.call(this, href, title, text);
      return link.replace(/<a /, '<a target="_blank" rel="noopener noreferrer" ');
    }
  };
  marked.use({ renderer });
  marked.use(markedSmartypants());

  export default marked;