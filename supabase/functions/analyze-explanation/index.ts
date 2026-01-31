import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini, parseJsonResponse, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/gemini-client.ts";

interface AnalysisResult {
  step_by_step_explanation: string;
  simple_summary: string;
  logical_strength_score: number;
  clarity_score: number;
  confidence_score: number;
  missing_assumptions: string[];
  improvement_suggestions: string[];
}

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

    const prompt = `You are a reasoning evaluation AI. Your job is to analyze the quality of human reasoning and explanations.

${languageInstruction}

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

Question/Decision: "${question}"

User's Answer/Reasoning: "${answer}"

${subject ? `Subject Area: ${subject}` : ""}

Analyze the quality of this reasoning and provide your evaluation as JSON. Output ONLY the JSON object, no other text.`;

    const response = await callGemini({ prompt, temperature: 0.3, jsonMode: true });

    if (response.error) {
      console.error("Gemini error:", response.error);
      const status = response.error.includes("Rate limit") ? 429 : 500;
      return createErrorResponse(response.error, status);
    }

    const analysis = parseJsonResponse<AnalysisResult>(response.text);
    
    if (!analysis) {
      return createErrorResponse("Invalid JSON response from AI", 500);
    }
    
    console.log("Generated analysis:", analysis);
    return createSuccessResponse(analysis);

  } catch (error) {
    console.error("analyze-explanation error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
