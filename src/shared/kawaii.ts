// ABOUTME: Kawaii text transformation for Miss Information mode
// ABOUTME: Adds ~, <3, uwu, ✨, etc. while preserving meaning

/**
 * Apply kawaii styling to text (for Miss Info mode)
 * Adds ~, <3, uwu, ✨, etc. while preserving the meaning
 */
export function makeKawaii(text: string): string {
  if (!text) return text;

  let result = text;

  // Replace periods with ~ sometimes (about 30% of the time)
  result = result.replace(/\.(\s+|$)/g, (match, space) => {
    if (Math.random() < 0.3) {
      return '~' + space;
    }
    return match;
  });

  // Add <3 for positive/love words occasionally
  const loveWords = ['good', 'great', 'excellent', 'helpful', 'useful', 'important'];
  loveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() < 0.15) {
        return match + ' <3';
      }
      return match;
    });
  });

  // Add "uwu" or "owo" very rarely (only once per text, and only 5% chance)
  if (Math.random() < 0.05 && result.length > 50) {
    result = result.replace(/([.!?])(\s+)/, (_match, punct, space) => {
      return punct + space + (Math.random() < 0.5 ? 'uwu' : 'owo') + ' ';
    });
  }

  // Add sparkles ✨ occasionally (10% chance per sentence)
  result = result.replace(/([.!?])(\s+)/g, (match, punct, space) => {
    if (Math.random() < 0.1) {
      return punct + ' ✨' + space;
    }
    return match;
  });

  // Make it slightly more casual - replace formal phrases occasionally
  result = result.replace(/it is important to note/gi, (match) => Math.random() < 0.3 ? 'just so you know~' : match);
  result = result.replace(/it should be noted/gi, (match) => Math.random() < 0.3 ? 'heads up~' : match);
  result = result.replace(/it is worth noting/gi, (match) => Math.random() < 0.3 ? 'worth mentioning~' : match);
  result = result.replace(/this suggests/gi, (match) => Math.random() < 0.25 ? 'this kinda suggests' : match);
  result = result.replace(/this indicates/gi, (match) => Math.random() < 0.25 ? 'this kinda indicates' : match);
  result = result.replace(/\bhowever\b/gi, (match, offset) => offset > 0 && Math.random() < 0.4 ? 'but' : match);
  result = result.replace(/\bfurthermore\b/gi, (match) => Math.random() < 0.3 ? 'also~' : match);
  result = result.replace(/\btherefore\b/gi, (match) => Math.random() < 0.3 ? 'so' : match);

  return result;
}
