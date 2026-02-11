// ABOUTME: Kawaii text transformation for Miss Information mode
// ABOUTME: Adds ~, <3, uwu, ✨, etc. while preserving meaning

/**
 * Apply kawaii styling to text (for Miss Info mode)
 * Adds ~, <3, uwu, ✨, etc. while preserving the meaning
 */
export function makeKawaii(text: string): string {
  if (!text) return text;

  let result = text;

  // Replace periods with ~ sometimes (about 60% of the time)
  result = result.replace(/\.(\s+|$)/g, (match, space) => {
    if (Math.random() < 0.6) {
      return '~' + space;
    }
    return match;
  });

  // Add <3 for positive/love words more often
  const loveWords = ['good', 'great', 'excellent', 'helpful', 'useful', 'important', 'nice', 'correct', 'right', 'valid'];
  loveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, (match) => {
      if (Math.random() < 0.4) {
        return match + ' <3';
      }
      return match;
    });
  });

  // Add "uwu" or "owo" much more frequently (25% chance, can appear multiple times)
  if (result.length > 30) {
    // Split into sentences and add uwu/owo to some
    result = result.replace(/([.!?])(\s+)/g, (match, punct, space) => {
      if (Math.random() < 0.50) {
        const kawaiis = ['uwu', 'owo', '>w<', 'nya~'];
        const chosen = kawaiis[Math.floor(Math.random() * kawaiis.length)];
        return punct + ' ' + chosen + space;
      }
      return match;
    });
  }

  // Add sparkles ✨ more often (25% chance per sentence)
  result = result.replace(/([.!?])(\s+)/g, (match, punct, space) => {
    if (Math.random() < 0.25) {
      return punct + ' ✨' + space;
    }
    return match;
  });

  // Add cute emoticons randomly throughout
  if (Math.random() < 0.3) {
    const emoticons = [' (◕‿◕)', ' (´∀｀)', ' (๑•̀ω•́๑)', ' (◡‿◡)', ' (｡◕‿◕｡)'];
    const chosen = emoticons[Math.floor(Math.random() * emoticons.length)];
    // Add to end of text
    result = result.replace(/([.!?])(\s*)$/, '$1' + chosen + '$2');
  }

  // Make it much more casual and kawaii - replace formal phrases more often
  result = result.replace(/it is important to note/gi, (match) => Math.random() < 0.7 ? 'just so you know~' : match);
  result = result.replace(/it should be noted/gi, (match) => Math.random() < 0.7 ? 'heads up~' : match);
  result = result.replace(/it is worth noting/gi, (match) => Math.random() < 0.7 ? 'worth mentioning~' : match);
  result = result.replace(/this suggests/gi, (match) => Math.random() < 0.6 ? 'this kinda suggests' : match);
  result = result.replace(/this indicates/gi, (match) => Math.random() < 0.6 ? 'this kinda indicates' : match);
  result = result.replace(/\bhowever\b/gi, (match, offset) => offset > 0 && Math.random() < 0.7 ? 'but' : match);
  result = result.replace(/\bfurthermore\b/gi, (match) => Math.random() < 0.6 ? 'also~' : match);
  result = result.replace(/\btherefore\b/gi, (match) => Math.random() < 0.6 ? 'so' : match);
  result = result.replace(/\bmoreover\b/gi, (match) => Math.random() < 0.5 ? 'plus~' : match);
  result = result.replace(/\bconsequently\b/gi, (match) => Math.random() < 0.5 ? 'so' : match);
  result = result.replace(/\bnevertheless\b/gi, (match) => Math.random() < 0.5 ? 'but still~' : match);
  
  // Add more kawaii phrases randomly
  if (Math.random() < 0.2) {
    const kawaiiPhrases = [' uwu', ' owo', ' nya~', ' >w<', ' (´｡• ᵕ •｡`) ♡'];
    const chosen = kawaiiPhrases[Math.floor(Math.random() * kawaiiPhrases.length)];
    // Insert randomly in the middle
    const words = result.split(' ');
    if (words.length > 3 && chosen) {
      const insertAt = Math.floor(words.length / 2) + Math.floor(Math.random() * 3) - 1;
      if (words[insertAt]) {
        words[insertAt] += chosen;
        result = words.join(' ');
      }
    }
  }

  return result;
}
