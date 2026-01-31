import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/lovable-ai-client.ts";
import { detectCategory } from "../_shared/text-analysis.ts";
import { generateExplanation } from "../_shared/explanation-templates.ts";

const SYSTEM_PROMPT = `You explain human decisions clearly and neutrally.

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

    const answersFormatted = (answers || [])
      .map((a: { question: string; answer: string }, i: number) => 
        `Q${i + 1}: "${a.question}"\nA${i + 1}: "${a.answer}"`)
      .join("\n\n");

    const userPrompt = `Decision: "${decision_text}"

${answersFormatted ? `Answers:\n${answersFormatted}\n\n` : ""}Explain why this decision was made.`;

    // Try AI first with retry for forbidden patterns
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
      attempts++;
      
      const aiResponse = await callLovableAI([
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt }
      ], { temperature: 0.5 });

      if (aiResponse.source === "ai" && aiResponse.text) {
        if (!containsForbiddenPatterns(aiResponse.text)) {
          console.log("AI generated explanation");
          return createSuccessResponse({ explanation: aiResponse.text }, "ai");
        }
        console.log(`Attempt ${attempts}: AI explanation contained forbidden patterns`);
      } else {
        break; // AI unavailable, go to fallback
      }
    }

    // Fallback to rule-based system
    console.log("Falling back to rule-based explanation");
    const category = detectCategory(decision_text);
    const explanation = generateExplanation(decision_text, answers || [], category);
    
    console.log("Rule-based explanation generated");
    return createSuccessResponse({ explanation }, "rules");

  } catch (error) {
    console.error("generate-explanation error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
