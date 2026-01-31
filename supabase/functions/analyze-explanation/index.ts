import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, parseAIJson, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/lovable-ai-client.ts";
import { 
  detectCategory, 
  calculateScores, 
  extractMissingAssumptions, 
  generateImprovements 
} from "../_shared/text-analysis.ts";
import { generateStepByStep, generateSummary } from "../_shared/explanation-templates.ts";

interface AnalysisResult {
  step_by_step_explanation: string;
  simple_summary: string;
  logical_strength_score: number;
  clarity_score: number;
  confidence_score: number;
  missing_assumptions: string[];
  improvement_suggestions: string[];
}

const SYSTEM_PROMPT = `You are a reasoning evaluation AI. Your job is to analyze the quality of human reasoning and explanations.

You must respond with a valid JSON object containing these exact fields:
- step_by_step_explanation: A detailed breakdown of the reasoning process (string)
- simple_summary: A 1-2 sentence plain language summary (string)
- logical_strength_score: How logically sound the reasoning is (integer 0-100)
- clarity_score: How clear and understandable the explanation is (integer 0-100)
- confidence_score: Your confidence in this analysis (integer 0-100)
- missing_assumptions: Array of unstated assumptions that could affect the conclusion (array of strings)
- improvement_suggestions: Specific ways to strengthen the reasoning (array of strings)

Be objective and analytical. Do not give advice or motivational language.
Focus on evaluating the QUALITY of reasoning, not whether the decision is "right" or "wrong".
Output ONLY the JSON object, no other text.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, answer, language = "en", subject } = await req.json();

    if (!question || !answer) {
      return createErrorResponse("question and answer are required", 400);
    }

    const languageInstruction = language === "hi" 
      ? "Respond in Hindi language." 
      : "Respond in English language.";

    const userPrompt = `${languageInstruction}

Question/Decision: "${question}"

User's Answer/Reasoning: "${answer}"

${subject ? `Subject Area: ${subject}` : ""}

Analyze the quality of this reasoning and provide your evaluation as JSON.`;

    // Try AI first
    const aiResponse = await callLovableAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ], { temperature: 0.3 });

    if (aiResponse.source === "ai" && aiResponse.text) {
      const analysis = parseAIJson<AnalysisResult>(aiResponse.text);
      
      if (analysis && 
          typeof analysis.logical_strength_score === 'number' &&
          typeof analysis.clarity_score === 'number') {
        console.log("AI generated analysis");
        return createSuccessResponse(analysis, "ai");
      }
    }

    // Fallback to rule-based system
    console.log("Falling back to rule-based analysis. Reason:", aiResponse.error || "AI parsing failed");
    
    const combinedText = `${question} ${answer} ${subject || ''}`;
    const category = detectCategory(combinedText);
    const scores = calculateScores(answer);
    
    const analysis: AnalysisResult = {
      step_by_step_explanation: generateStepByStep(question, [{ question, answer }], category),
      simple_summary: generateSummary(question, category),
      logical_strength_score: scores.logicalStrength,
      clarity_score: scores.clarity,
      confidence_score: scores.confidence,
      missing_assumptions: extractMissingAssumptions(answer, category),
      improvement_suggestions: generateImprovements(answer, scores)
    };

    console.log("Rule-based analysis generated");
    return createSuccessResponse(analysis, "rules");

  } catch (error) {
    console.error("analyze-explanation error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
