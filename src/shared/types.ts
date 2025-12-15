/**
 * Shared TypeScript types
 */

export type Importance = 'critical' | 'significant' | 'minor';
export type Severity = 'none' | 'minor' | 'moderate' | 'significant';

export interface AnalysisIssue {
  importance: Importance;
  quote: string;
  gap: string;
}

export interface CentralArgumentAnalysis {
  main_conclusion: string;
  central_logical_gap: string;
}

export interface AnalysisResult {
  central_argument_analysis: CentralArgumentAnalysis;
  issues: AnalysisIssue[];
  severity: Severity;
}

export interface Article {
  title: string;
  text: string;
  url: string;
}

export interface DemoExample {
  quote: string;
  highlightedPart: string;
  gap: string;
  importance: Importance;
}
