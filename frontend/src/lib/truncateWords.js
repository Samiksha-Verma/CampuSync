// Word-count truncation (not just CSS line-clamp) so a very long description never
// pushes a card taller - a short one and a long one render at the same size.
export const truncateWords = (text, maxWords = 18) => {
  if (!text) return '';
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return `${words.slice(0, maxWords).join(' ')}...`;
};
