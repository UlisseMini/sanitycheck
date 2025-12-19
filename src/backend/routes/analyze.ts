// ABOUTME: Anthropic API proxy route for article analysis.
// ABOUTME: Forwards prompts to Claude and returns responses.

import { Router, Request, Response } from 'express';
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL } from '../shared';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    if (!ANTHROPIC_API_KEY) {
      res.status(500).json({ error: 'Anthropic API key not configured on server' });
      return;
    }

    const { prompt, maxTokens = 8192, temperature = 0.3 } = req.body;

    if (!prompt) {
      res.status(400).json({ error: 'prompt is required' });
      return;
    }

    console.log(`[analyze] Calling Anthropic API, prompt length: ${prompt.length}`);
    const startTime = Date.now();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`[analyze] Anthropic API error: ${response.status}`, errorData);
      res.status(response.status).json({
        error: `Anthropic API error: ${response.status}`,
        details: errorData
      });
      return;
    }

    const data = await response.json() as {
      model: string;
      content: Array<{ type: string; text: string }>;
    };
    console.log(`[analyze] Success in ${duration}ms, model: ${data.model}`);

    const firstContent = data.content[0];
    if (data.content && data.content.length > 0 && firstContent) {
      res.json({ text: firstContent.text, model: data.model, duration });
    } else {
      res.status(500).json({ error: 'No content in API response' });
    }
  } catch (error) {
    console.error('[analyze] Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
