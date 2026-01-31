import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/gemini-client.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { decision_text } = await req.json();

    if (!decision_text) {
      return createErrorResponse("decision_text is required", 400);
    }

    const prompt = `You are a behavioral reasoning assistant.
Your task is to ask short, specific questions to understand why a person made a decision.

Rules:
- Ask a maximum of 3 questions
- No advice
- No encouragement
- No motivational language
- No explanations
- Output ONLY questions, one per line
- Do not number the questions

Decision: "${decision_text}"

Generate 3 short questions to understand why this decision was made.`;

    const response = await callGemini({ prompt, temperature: 0.5 });

    if (response.error) {
      console.error("Gemini error:", response.error);
      const status = response.error.includes("Rate limit") ? 429 : 500;
      return createErrorResponse(response.error, status);
    }

    // Parse questions from the response
    const questions = response.text
      .split("\n")
      .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
      .filter((line: string) => line.length > 0 && line.endsWith("?"))
      .slice(0, 3);

    if (questions.length === 0) {
      return createErrorResponse("Failed to parse questions from AI response", 500);
    }

    console.log("Generated questions:", questions);
    return createSuccessResponse({ questions });

  } catch (error) {
    console.error("generate-questions error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
