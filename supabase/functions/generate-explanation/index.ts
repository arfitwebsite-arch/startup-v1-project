import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
      return new Response(
        JSON.stringify({ error: "decision_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    let explanation = "";
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: "Payment required." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error("AI gateway error");
      }

      const data = await response.json();
      explanation = data.choices?.[0]?.message?.content || "";

      if (!containsForbiddenPatterns(explanation)) {
        break;
      }

      console.log(`Attempt ${attempts}: Explanation contained forbidden patterns, regenerating...`);
    }

    if (!explanation) {
      throw new Error("Failed to generate explanation");
    }

    console.log("Generated explanation:", explanation);

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-explanation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
