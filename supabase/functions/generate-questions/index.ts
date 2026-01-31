import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/lovable-ai-client.ts";
import { detectCategory } from "../_shared/text-analysis.ts";
import { generateQuestions } from "../_shared/question-templates.ts";

const SYSTEM_PROMPT = `You are a behavioral reasoning assistant.
Your task is to ask short, specific questions to understand why a person made a decision.

Rules:
- Ask a maximum of 3 questions
- No advice
- No encouragement
- No motivational language
- No explanations
- Output ONLY questions, one per line
- Do not number the questions`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { decision_text } = await req.json();

    if (!decision_text) {
      return createErrorResponse("decision_text is required", 400);
    }

    // Try AI first
    const aiResponse = await callLovableAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: `Decision: "${decision_text}"\n\nGenerate 3 short questions to understand why this decision was made.` }
    ], { temperature: 0.5 });

    if (aiResponse.source === "ai" && aiResponse.text) {
      // Parse questions from AI response
      const questions = aiResponse.text
        .split("\n")
        .map((line: string) => line.replace(/^\d+\.\s*/, "").replace(/^[-•]\s*/, "").trim())
        .filter((line: string) => line.length > 0 && line.endsWith("?"))
        .slice(0, 3);

      if (questions.length > 0) {
        console.log("AI generated questions:", questions);
        return createSuccessResponse({ questions }, "ai");
      }
    }

    // Fallback to rule-based system
    console.log("Falling back to rule-based questions. Reason:", aiResponse.error || "AI parsing failed");
    const category = detectCategory(decision_text);
    const questions = generateQuestions(decision_text, category);
    
    console.log("Rule-based questions:", questions);
    return createSuccessResponse({ questions }, "rules");

  } catch (error) {
    console.error("generate-questions error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
