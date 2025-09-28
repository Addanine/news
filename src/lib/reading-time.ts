export function getWordCount(text: string): number {
  if (!text) return 0;
  const words = text
    .replace(/<[^>]+>/g, " ")
    .replace(/[^\w\s'-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return words.length;
}

export function estimateReadingTime(text: string, wordsPerMinute: number): number {
  if (!text) return 0;
  const wordCount = getWordCount(text);
  if (wordCount === 0 || !wordsPerMinute) return 0;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}
