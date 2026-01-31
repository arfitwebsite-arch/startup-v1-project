import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { detectCategory, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/text-analysis.ts";
import { generateQuestions } from "../_shared/question-templates.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { decision_text } = await req.json();

    if (!decision_text) {
      return createErrorResponse("decision_text is required", 400);
    }

    // Detect decision category
    const category = detectCategory(decision_text);
    console.log(`Detected category: ${category}`);

    // Generate questions using rule-based system
    const questions = generateQuestions(decision_text, category);
    
    console.log("Generated questions:", questions);
    return createSuccessResponse({ questions });

  } catch (error) {
    console.error("generate-questions error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
