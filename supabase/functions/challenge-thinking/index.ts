import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callLovableAI, parseAIJson, corsHeaders, createErrorResponse, createSuccessResponse } from "../_shared/lovable-ai-client.ts";
import { detectCategory, detectBiases } from "../_shared/text-analysis.ts";
import { generateCounterQuestions } from "../_shared/question-templates.ts";

interface ChallengeResult {
  logical_flaws: string[];
  bias_analysis: string;
  counter_questions: string[];
  suggested_improvements: string[];
}

const SYSTEM_PROMPT = `You are a critical thinking coach. Your role is to challenge the user's reasoning to help them think more clearly.

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
Output ONLY the JSON object, no other text.`;

// Logical flaw patterns for rule-based fallback
const LOGICAL_FLAW_PATTERNS: Record<string, { patterns: string[]; flaw: string }> = {
  hasty_generalization: {
    patterns: ['always', 'never', 'everyone', 'no one', 'all people'],
    flaw: 'Hasty Generalization: Drawing broad conclusions from limited examples'
  },
  false_dichotomy: {
    patterns: ['only two', 'either or', 'no other option', 'only choice'],
    flaw: 'False Dichotomy: Presenting only two options when more exist'
  },
  appeal_to_emotion: {
    patterns: ['feel strongly', 'heart says', 'gut tells', 'just know'],
    flaw: 'Appeal to Emotion: Using feelings as primary evidence for conclusions'
  },
  circular_reasoning: {
    patterns: ['because it is', 'obviously', 'clearly', 'self-evident'],
    flaw: 'Circular Reasoning: The conclusion is assumed in the premise'
  },
  slippery_slope: {
    patterns: ['will lead to', 'next thing', 'before you know it', 'inevitably'],
    flaw: 'Slippery Slope: Assuming one event will trigger a chain of negative consequences'
  }
};

function detectLogicalFlaws(text: string): string[] {
  const lowerText = text.toLowerCase();
  const flaws: string[] = [];

  for (const [, flawInfo] of Object.entries(LOGICAL_FLAW_PATTERNS)) {
    for (const pattern of flawInfo.patterns) {
      if (lowerText.includes(pattern)) {
        if (!flaws.includes(flawInfo.flaw)) {
          flaws.push(flawInfo.flaw);
        }
        break;
      }
    }
  }

  const wordCount = text.split(/\s+/).length;
  if (wordCount < 20) {
    flaws.push('Insufficient Elaboration: Reasoning lacks detailed explanation');
  }

  return flaws.slice(0, 4);
}

function generateBiasAnalysis(biases: { bias: string; description: string }[], category: string): string {
  if (biases.length === 0) {
    return `No obvious cognitive biases were detected. However, biases can be subtle. Consider having someone with a different perspective review your reasoning for blind spots.`;
  }

  const biasNames = biases.map(b => b.bias).join(', ');
  const primaryBias = biases[0];
  
  return `The reasoning shows potential signs of: ${biasNames}. The most prominent appears to be ${primaryBias.bias}, which involves ${primaryBias.description.toLowerCase()}. Consider whether you would reach the same conclusion with fresh eyes.`;
}

function generateThinkingImprovements(flaws: string[], biases: { bias: string; description: string }[]): string[] {
  const improvements: string[] = [];

  if (flaws.length > 0) {
    improvements.push('Explicitly state your assumptions and test each one for validity');
    improvements.push('Create a structured argument with clear premises leading to your conclusion');
  }

  if (biases.length > 0) {
    improvements.push('Seek out evidence that contradicts your current position');
    improvements.push('Ask someone with a different perspective to challenge your reasoning');
  }

  improvements.push('Document alternatives you considered and why you rejected them');
  improvements.push('Consider what would need to be true for your conclusion to be wrong');

  return improvements.slice(0, 5);
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

    const userPrompt = `Problem Statement: "${problem_statement}"

User's Reasoning: "${user_reasoning}"

User's Conclusion: "${user_conclusion}"

Analyze this thinking process and provide your challenge as JSON.`;

    // Try AI first
    const aiResponse = await callLovableAI([
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt }
    ], { temperature: 0.4 });

    if (aiResponse.source === "ai" && aiResponse.text) {
      const challenge = parseAIJson<ChallengeResult>(aiResponse.text);
      
      if (challenge && 
          Array.isArray(challenge.logical_flaws) &&
          typeof challenge.bias_analysis === 'string') {
        console.log("AI generated challenge");
        return createSuccessResponse(challenge, "ai");
      }
    }

    // Fallback to rule-based system
    console.log("Falling back to rule-based challenge. Reason:", aiResponse.error || "AI parsing failed");
    
    const category = detectCategory(problem_statement);
    const combinedText = `${user_reasoning} ${user_conclusion}`;
    
    const logicalFlaws = detectLogicalFlaws(combinedText);
    const biases = detectBiases(combinedText);
    
    const challenge: ChallengeResult = {
      logical_flaws: logicalFlaws,
      bias_analysis: generateBiasAnalysis(biases, category),
      counter_questions: generateCounterQuestions(user_reasoning, user_conclusion, category),
      suggested_improvements: generateThinkingImprovements(logicalFlaws, biases)
    };

    console.log("Rule-based challenge generated");
    return createSuccessResponse(challenge, "rules");

  } catch (error) {
    console.error("challenge-thinking error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
