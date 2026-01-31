import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGemini, parseJsonResponse, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/gemini-client.ts";

interface ChallengeResult {
  logical_flaws: string[];
  bias_analysis: string;
  counter_questions: string[];
  suggested_improvements: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { problem_statement, user_reasoning, user_conclusion } = await req.json();

    if (!problem_statement || !user_reasoning || !user_conclusion) {
      return createErrorResponse("problem_statement, user_reasoning, and user_conclusion are required", 400);
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

    const response = await callGemini({ prompt, temperature: 0.4, jsonMode: true });

    if (response.error) {
      console.error("Gemini error:", response.error);
      const status = response.error.includes("Rate limit") ? 429 : 500;
      return createErrorResponse(response.error, status);
    }

    const challenge = parseJsonResponse<ChallengeResult>(response.text);
    
    if (!challenge) {
      return createErrorResponse("Invalid JSON response from AI", 500);
    }
    
    console.log("Generated challenge:", challenge);
    return createSuccessResponse(challenge);

  } catch (error) {
    console.error("challenge-thinking error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
