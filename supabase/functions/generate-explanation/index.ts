import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/gemini-client.ts";

// Check if explanation contains forbidden patterns
function containsForbiddenPatterns(text: string): boolean {
  const forbiddenPatterns = [
    /you should/i,
    /next time/i,
    /try to/i,
    /consider/i,
    /i recommend/i,
    /i suggest/i,
    /it would be better/i,
    /you could/i,
    /you might want to/i,
    /keep up/i,
    /great job/i,
    /well done/i,
  ];

  return forbiddenPatterns.some((pattern) => pattern.test(text));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { decision_text, answers } = await req.json();

    if (!decision_text) {
      return createErrorResponse("decision_text is required", 400);
    }

    const systemPrompt = `You explain human decisions clearly and neutrally.

Rules:
- Explain WHY the decision was made
- Use second-person ("you")
- 4 to 6 short lines maximum
- No advice
- No suggestions
- No judgment
- No motivational tone
- No "you should", "next time", "consider", "try to"
- Simply state the reasoning behind the decision`;

    const answersFormatted = (answers || [])
      .map((a: { question: string; answer: string }, i: number) => `Q${i + 1}: "${a.question}"\nA${i + 1}: "${a.answer}"`)
      .join("\n\n");

    const userPrompt = `Decision: "${decision_text}"

${answersFormatted ? `Answers:\n${answersFormatted}\n\n` : ""}Explain why this decision was made.`;

    const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

    let explanation = "";
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;

      const response = await callGemini({ prompt: fullPrompt, temperature: 0.5 });

      if (response.error) {
        console.error("Gemini error:", response.error);
        const status = response.error.includes("Rate limit") ? 429 : 500;
        return createErrorResponse(response.error, status);
      }

      explanation = response.text;

      if (!containsForbiddenPatterns(explanation)) {
        break;
      }

      console.log(`Attempt ${attempts}: Explanation contained forbidden patterns, regenerating...`);
    }

    if (!explanation) {
      return createErrorResponse("Failed to generate explanation", 500);
    }

    console.log("Generated explanation:", explanation);
    return createSuccessResponse({ explanation });

  } catch (error) {
    console.error("generate-explanation error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
