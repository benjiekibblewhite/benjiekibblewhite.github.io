// Helper function to detect and extract complete markdown links
export function extractCompleteLinks(text) {
  // Regular expression to match markdown links: [text](url) or [text](url "title")
  const linkRegex = /\[([^\]]+)\]\(([^)]+)(?:\s+"([^"]*)")?\)/g;
  const links = [];
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    links.push({
      fullMatch: match[0],
      text: match[1],
      url: match[2],
      title: match[3] || "",
    });
  }

  return links;
}

// Helper function to generate preview text that includes complete links
export function generatePreviewWithLinks(text, maxLength = 150) {
  const links = extractCompleteLinks(text);

  if (links.length === 0) {
    // No links found, use simple truncation
    return (
      text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
    );
  }

  // Find the first link and ensure it's included in the preview
  const firstLink = links[0];
  const linkStartIndex = text.indexOf(firstLink.fullMatch);

  if (linkStartIndex === -1) {
    // Link not found in text (shouldn't happen), fallback to simple truncation
    return (
      text.substring(0, maxLength) + (text.length > maxLength ? "..." : "")
    );
  }

  // Calculate where to end the preview to include the complete first link
  const linkEndIndex = linkStartIndex + firstLink.fullMatch.length;
  const previewEndIndex = Math.max(linkEndIndex, maxLength);

  // Extract preview text
  let preview = text.substring(0, previewEndIndex);

  // Add ellipsis if we truncated the text
  if (previewEndIndex < text.length) {
    preview += "...";
  }

  return preview;
}
