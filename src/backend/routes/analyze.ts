// ABOUTME: Analysis endpoint using the pipeline system.
// ABOUTME: Loads pipeline, runs analysis, formats output for extension.

import { Router, Request, Response } from 'express';
import { loadPipeline } from '../../pipelines/index';
import { formatForExtension } from '../../pipelines/format';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const { text, pipeline: pipelineName = 'default' } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    console.log(`[analyze] Using pipeline: ${pipelineName}, text length: ${text.length}`);
    const startTime = Date.now();

    // Load and run pipeline
    const pipeline = await loadPipeline(pipelineName);
    const analysisText = await pipeline.analyze(text);

    // Format for extension
    const structured = await formatForExtension(analysisText, text);

    const duration = Date.now() - startTime;
    console.log(`[analyze] Complete in ${duration}ms`);

    res.json({
      ...structured,
      pipeline: pipelineName,
      duration
    });
  } catch (error) {
    console.error('[analyze] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    res.status(500).json({ error: message });
  }
});

export default router;
