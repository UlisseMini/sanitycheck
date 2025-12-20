// ABOUTME: Type definitions for analysis pipelines.
// ABOUTME: Defines the Pipeline interface and AnalyzeFn type.

/**
 * Progress callback for multi-step pipelines.
 * @param percent - Progress percentage (0-100)
 */
export type OnProgress = (percent: number) => void;

/**
 * Core analysis function signature.
 * Takes article text, optionally reports progress, returns analysis text.
 */
export type AnalyzeFn = (
  text: string,
  onProgress?: OnProgress
) => Promise<string>;

/**
 * Pipeline module interface.
 * Each pipeline file exports an object conforming to this interface.
 */
export interface Pipeline {
  /** Unique identifier matching the filename (e.g., "default", "critique-steelman") */
  name: string;
  /** Human-readable description of what this pipeline does */
  description: string;
  /** The analysis function */
  analyze: AnalyzeFn;
}
