import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  detectCategory, 
  calculateScores, 
  extractMissingAssumptions, 
  generateImprovements,
  corsHeaders, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/text-analysis.ts";
import { generateStepByStep, generateSummary } from "../_shared/explanation-templates.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, answer, language = "en", subject } = await req.json();

    if (!question || !answer) {
      return createErrorResponse("question and answer are required", 400);
    }

    // Detect category from question and answer
    const combinedText = `${question} ${answer} ${subject || ''}`;
    const category = detectCategory(combinedText);
    console.log(`Detected category: ${category}`);

    // Calculate heuristic scores
    const scores = calculateScores(answer);
    console.log(`Scores: logical=${scores.logicalStrength}, clarity=${scores.clarity}, confidence=${scores.confidence}`);

    // Generate step-by-step explanation
    const stepByStep = generateStepByStep(
      question, 
      [{ question, answer }], 
      category
    );

    // Generate simple summary
    const simpleSummary = generateSummary(question, category);

    // Extract missing assumptions
    const missingAssumptions = extractMissingAssumptions(answer, category);

    // Generate improvement suggestions
    const improvements = generateImprovements(answer, scores);

    const analysis = {
      step_by_step_explanation: stepByStep,
      simple_summary: simpleSummary,
      logical_strength_score: scores.logicalStrength,
      clarity_score: scores.clarity,
      confidence_score: scores.confidence,
      missing_assumptions: missingAssumptions,
      improvement_suggestions: improvements
    };

    console.log("Generated analysis:", analysis);
    return createSuccessResponse(analysis);

  } catch (error) {
    console.error("analyze-explanation error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
