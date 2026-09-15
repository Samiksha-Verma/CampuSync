// Replies come back as plain markdown-ish text (real \n line breaks, **bold**
// spans). Pulling in a full markdown library for this one surface is overkill, so this
// does just enough: preserves line breaks via CSS and turns **bold** into <strong>.
export const formatChatText = (text) => {
  const cleaned = text
    .replace(/^#{1,6}\s*/gm, '') // strip markdown headers - rendered inline, a leading "### " reads as noise
    .replace(/^[*-]\s+/gm, '• '); // turn "* item" / "- item" bullets into a real bullet glyph

  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
};
