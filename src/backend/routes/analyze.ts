// ABOUTME: Analysis endpoint with typed request/response.
// ABOUTME: Type safety flows to extension via App type export.

import { Elysia, t, type Static } from 'elysia'
import { loadPipeline } from '../../pipelines/index'
import { formatForExtension } from '../../pipelines/format'

// Schema definitions - single source of truth for types
const AnalysisIssueSchema = t.Object({
  importance: t.Union([t.Literal('critical'), t.Literal('significant'), t.Literal('minor')]),
  quote: t.String(),
  gap: t.String()
})

const CentralArgumentAnalysisSchema = t.Object({
  main_conclusion: t.String(),
  central_logical_gap: t.Nullable(t.String())
})

const AnalysisResponseSchema = t.Object({
  central_argument_analysis: CentralArgumentAnalysisSchema,
  issues: t.Array(AnalysisIssueSchema),
  severity: t.Union([
    t.Literal('none'),
    t.Literal('minor'),
    t.Literal('moderate'),
    t.Literal('significant')
  ]),
  pipeline: t.String(),
  duration: t.Number()
})

// Export TypeScript types derived from schemas
export type AnalysisIssue = Static<typeof AnalysisIssueSchema>
export type CentralArgumentAnalysis = Static<typeof CentralArgumentAnalysisSchema>
export type AnalysisResponse = Static<typeof AnalysisResponseSchema>
export type Importance = AnalysisIssue['importance']
export type Severity = AnalysisResponse['severity']

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
    response: AnalysisResponseSchema
  })
