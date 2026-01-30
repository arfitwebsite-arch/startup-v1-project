import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { question, answer, language = "en", subject } = await req.json();

    if (!question || !answer) {
      return new Response(
        JSON.stringify({ error: "question and answer are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const languageInstruction = language === "hi" 
      ? "Respond in Hindi language." 
      : "Respond in English language.";

    const systemPrompt = `You are a reasoning evaluation AI. Your job is to analyze the quality of human reasoning and explanations.

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
Focus on evaluating the QUALITY of reasoning, not whether the decision is "right" or "wrong".`;

    const userPrompt = `Question/Decision: "${question}"

User's Answer/Reasoning: "${answer}"

${subject ? `Subject Area: ${subject}` : ""}

Analyze the quality of this reasoning and provide your evaluation as JSON.`;

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
        temperature: 0.3,
        tools: [
          {
            type: "function",
            function: {
              name: "provide_analysis",
              description: "Provide the reasoning analysis results",
              parameters: {
                type: "object",
                properties: {
                  step_by_step_explanation: { type: "string" },
                  simple_summary: { type: "string" },
                  logical_strength_score: { type: "integer", minimum: 0, maximum: 100 },
                  clarity_score: { type: "integer", minimum: 0, maximum: 100 },
                  confidence_score: { type: "integer", minimum: 0, maximum: 100 },
                  missing_assumptions: { type: "array", items: { type: "string" } },
                  improvement_suggestions: { type: "array", items: { type: "string" } },
                },
                required: [
                  "step_by_step_explanation",
                  "simple_summary",
                  "logical_strength_score",
                  "clarity_score",
                  "confidence_score",
                  "missing_assumptions",
                  "improvement_suggestions"
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_analysis" } },
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
    
    // Extract the function call arguments
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "provide_analysis") {
      throw new Error("Invalid response format from AI");
    }

    const analysis = JSON.parse(toolCall.function.arguments);
    
    console.log("Generated analysis:", analysis);

    return new Response(
      JSON.stringify(analysis),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("analyze-explanation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
