// ABOUTME: Analysis endpoint with typed request/response.
// ABOUTME: Type safety flows to extension via App type export.

import { Elysia, t } from 'elysia'
import { loadPipeline } from '../../pipelines/index'
import { formatForExtension } from '../../pipelines/format'

// Schema definitions - these become the source of truth for types
const AnalysisIssue = t.Object({
  importance: t.Union([t.Literal('critical'), t.Literal('significant'), t.Literal('minor')]),
  quote: t.String(),
  gap: t.String()
})

const CentralArgumentAnalysis = t.Object({
  main_conclusion: t.String(),
  central_logical_gap: t.Nullable(t.String())
})

const AnalysisResponse = t.Object({
  central_argument_analysis: CentralArgumentAnalysis,
  issues: t.Array(AnalysisIssue),
  severity: t.Union([
    t.Literal('none'),
    t.Literal('minor'),
    t.Literal('moderate'),
    t.Literal('significant')
  ]),
  pipeline: t.String(),
  duration: t.Number()
})

const AnalyzeRequest = t.Object({
  text: t.String(),
  pipeline: t.Optional(t.String())
})

export const analyzeRoutes = new Elysia({ prefix: '/analyze' })
  .post('/', async ({ body }) => {
    const { text, pipeline: pipelineName = 'default' } = body

    if (!text) {
      throw new Error('text is required')
    }

    console.log(`[analyze] Using pipeline: ${pipelineName}, text length: ${text.length}`)
    const startTime = Date.now()

    // Load and run pipeline
    const pipeline = await loadPipeline(pipelineName)
    const analysisText = await pipeline.analyze(text)

    // Format for extension
    const structured = await formatForExtension(analysisText, text)

    const duration = Date.now() - startTime
    console.log(`[analyze] Complete in ${duration}ms`)

    return {
      ...structured,
      pipeline: pipelineName,
      duration
    }
  }, {
    body: AnalyzeRequest,
    response: AnalysisResponse
  })
