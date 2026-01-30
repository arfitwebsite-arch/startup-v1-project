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
    const { problem_statement, user_reasoning, user_conclusion } = await req.json();

    if (!problem_statement || !user_reasoning || !user_conclusion) {
      return new Response(
        JSON.stringify({ error: "problem_statement, user_reasoning, and user_conclusion are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = `You are a critical thinking coach. Your role is to challenge the user's reasoning to help them think more clearly.

IMPORTANT RULES:
- Do NOT give the answer or tell them what to conclude
- Do NOT be judgmental or discouraging
- Focus on identifying gaps, biases, and logical flaws
- Ask counter-questions that make them reconsider
- Suggest ways to strengthen their reasoning process

You must respond with a valid JSON object containing:
- logical_flaws: Array of specific logical fallacies or errors in reasoning (array of strings)
- bias_analysis: A paragraph analyzing potential cognitive biases at play (string)
- counter_questions: Thought-provoking questions that challenge their assumptions (array of strings, max 5)
- suggested_improvements: Specific ways to strengthen their reasoning process (array of strings)

Be constructive but rigorous. The goal is to improve their thinking, not to prove them wrong.`;

    const userPrompt = `Problem Statement: "${problem_statement}"

User's Reasoning: "${user_reasoning}"

User's Conclusion: "${user_conclusion}"

Analyze this thinking process and provide your challenge as JSON.`;

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
        temperature: 0.4,
        tools: [
          {
            type: "function",
            function: {
              name: "provide_challenge",
              description: "Provide the thinking challenge results",
              parameters: {
                type: "object",
                properties: {
                  logical_flaws: { type: "array", items: { type: "string" } },
                  bias_analysis: { type: "string" },
                  counter_questions: { type: "array", items: { type: "string" } },
                  suggested_improvements: { type: "array", items: { type: "string" } },
                },
                required: [
                  "logical_flaws",
                  "bias_analysis",
                  "counter_questions",
                  "suggested_improvements"
                ],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "provide_challenge" } },
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
    if (!toolCall || toolCall.function.name !== "provide_challenge") {
      throw new Error("Invalid response format from AI");
    }

    const challenge = JSON.parse(toolCall.function.arguments);
    
    console.log("Generated challenge:", challenge);

    return new Response(
      JSON.stringify(challenge),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("challenge-thinking error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
