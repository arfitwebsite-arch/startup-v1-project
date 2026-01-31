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

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
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
            temperature: 0.3,
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
    
    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse JSON response:", content);
      throw new Error("Invalid JSON response from AI");
    }
    
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
