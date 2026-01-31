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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const prompt = `You are a critical thinking coach. Your role is to challenge the user's reasoning to help them think more clearly.

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

Be constructive but rigorous. The goal is to improve their thinking, not to prove them wrong.

Problem Statement: "${problem_statement}"

User's Reasoning: "${user_reasoning}"

User's Conclusion: "${user_conclusion}"

Analyze this thinking process and provide your challenge as JSON. Output ONLY the JSON object, no other text.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    let challenge;
    try {
      challenge = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON response:", content);
      throw new Error("Invalid JSON response from AI");
    }
    
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
