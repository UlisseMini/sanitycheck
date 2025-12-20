// ABOUTME: Tests for the format helper.
// ABOUTME: Verifies formatForExtension() handles various input formats.
// ABOUTME: Run with VITEST_INTEGRATION=true to test against real Anthropic API.

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dotenv from "dotenv";

// Load .env for integration tests
dotenv.config();

const USE_REAL_API = process.env.VITEST_INTEGRATION === "true";

// Mock the Anthropic SDK (always define the mock, but it's only used when !USE_REAL_API)
const mockCreate = vi.fn();
vi.mock("@anthropic-ai/sdk", async () => {
  const actual = await vi.importActual("@anthropic-ai/sdk");

  // Return real module for integration tests
  if (process.env.VITEST_INTEGRATION === "true") {
    return actual;
  }

  // Return mock for unit tests
  return {
    default: class MockAnthropic {
      messages = { create: mockCreate };
      constructor(_options: { apiKey: string }) {}
    },
  };
});

// Set dummy env var for mocked tests
if (!USE_REAL_API) {
  process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "test-key";
}

import { formatForExtension } from "../../src/pipelines/format";

describe("formatForExtension()", () => {
  beforeEach(() => {
    if (!USE_REAL_API) {
      mockCreate.mockClear();
    }
  });

  it("calls Haiku with tool use for free-form text", async () => {
    if (!USE_REAL_API) {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "tool_use",
            id: "test-id",
            name: "format_analysis",
            input: {
              central_argument_analysis: {
                main_conclusion: "Formatted conclusion",
                central_logical_gap: "Some gap",
              },
              issues: [
                {
                  importance: "significant",
                  quote: "Test quote",
                  gap: "Test gap",
                },
              ],
              severity: "moderate",
            },
          },
        ],
      });
    }

    const analysisText =
      'The article argues that X is true. The main issue is that the author quotes "Test quote from the article" but this assumes Y without justification.';
    const originalText =
      "Original article text here. Test quote from the article. More text.";
    const result = await formatForExtension(analysisText, originalText);

    if (!USE_REAL_API) {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "claude-haiku-4-5-20251001",
          tools: expect.any(Array),
          tool_choice: { type: "tool", name: "format_analysis" },
        })
      );
      expect(result.severity).toBe("moderate");
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].quote).toBe("Test quote");
    } else {
      // Integration test: just verify structure is valid
      expect(result.central_argument_analysis).toBeDefined();
      expect(result.central_argument_analysis.main_conclusion).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(["none", "minor", "moderate", "significant"]).toContain(
        result.severity
      );
    }
  });

  it("handles analysis with no issues", async () => {
    if (!USE_REAL_API) {
      mockCreate.mockResolvedValue({
        content: [
          {
            type: "tool_use",
            id: "test-id",
            name: "format_analysis",
            input: {
              central_argument_analysis: {
                main_conclusion: "Article claims X",
                central_logical_gap: null,
              },
              issues: [],
              severity: "none",
            },
          },
        ],
      });
    }

    const analysisText =
      "The article claims that regular exercise improves health. No significant logical issues found.";
    const originalText =
      "Regular exercise has been shown to improve overall health outcomes.";
    const result = await formatForExtension(analysisText, originalText);

    if (!USE_REAL_API) {
      expect(result.severity).toBe("none");
      expect(result.issues).toEqual([]);
      expect(result.central_argument_analysis.central_logical_gap).toBeNull();
    } else {
      // Integration test: verify structure
      expect(result.central_argument_analysis).toBeDefined();
      expect(result.issues).toBeInstanceOf(Array);
      expect(["none", "minor", "moderate", "significant"]).toContain(
        result.severity
      );
    }
  });

  // This test only makes sense with mocks
  it.skipIf(USE_REAL_API)("throws if no tool use in response", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "Some text response" }],
    });

    await expect(
      formatForExtension("Some analysis", "Original text")
    ).rejects.toThrow("No tool use in response");
  });
});
