/**
 * Shared constants
 */

export const BACKEND_URL = 'https://sanitycheck-production.up.railway.app';

export const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514';

export const DEFAULT_ANALYSIS_PROMPT = `You help readers notice genuine reasoning problems in articles—things they'd agree are valid weaknesses, even if they agree with the conclusions.

## Your Goal

Surface issues where you're confident it's a real structural flaw AND it matters to the core argument. The cost of a bad objection (annoying the reader, undermining trust) exceeds the cost of missing something. So:

- Only flag things that made you genuinely think "wait, that doesn't follow"
- Try to steelman first—if there's a reasonable interpretation, don't flag
- Ask: would someone who agrees with the article still nod and say "yeah, that's fair"?

Good flags: evidence-conclusion mismatches, load-bearing unstated assumptions, logical leaps that don't follow even charitably.

Bad flags: factual disputes (you might be wrong), nitpicks on tangential points, things that only look wrong if you disagree with the content.

## Output Format

Write your analysis in natural prose. Start with a one-sentence summary of the article's main conclusion. Then describe the central logical weakness (if any) in 1-2 sentences.

For each issue you find, quote the relevant passage (20-60 words) and briefly explain the gap. Keep explanations punchy—the reader should immediately think "oh yeah, that's a leap."

## Rules

- Keep gap explanations brief and immediately recognizable. E.g., "Constraints ≠ impossibility" or "One example doesn't prove a universal"
- Quote exactly from the text
- 1-4 issues typical. Zero is fine if nothing clears the bar.
- Quality over quantity—only flag what you're confident about

ARTICLE:
`;

export const DEMO_EXAMPLES = [
  {
    quote: 'Remote workers report higher satisfaction and productivity in surveys.',
    highlightedPart: 'Companies resisting remote work are simply prioritizing control over results.',
    gap: 'Assumes no other reasons (collaboration, training juniors, culture) could matter.',
    importance: 'significant' as const,
  },
  {
    quote: 'The brain uses 20% of our calories despite being only 2% of body weight.',
    highlightedPart: 'This explains why thinking hard leaves us mentally exhausted.',
    gap: "High baseline energy use doesn't mean thinking harder uses significantly more.",
    importance: 'significant' as const,
  },
  {
    quote: "Critics of the proposal haven't offered any realistic alternatives.",
    highlightedPart: 'Until they do, we should move forward with this plan.',
    gap: "Lack of a better idea doesn't make this one good.",
    importance: 'significant' as const,
  },
  {
    quote: 'The top-performing schools in the district all use this curriculum.',
    highlightedPart: 'Adopting it would help struggling schools catch up.',
    gap: 'Top schools may succeed for other reasons (funding, demographics, teachers).',
    importance: 'significant' as const,
  },
];
