import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  detectCategory, 
  detectBiases, 
  corsHeaders, 
  createErrorResponse, 
  createSuccessResponse 
} from "../_shared/text-analysis.ts";
import { generateCounterQuestions } from "../_shared/question-templates.ts";

// Logical flaw patterns
const LOGICAL_FLAW_PATTERNS: Record<string, { patterns: string[]; flaw: string }> = {
  hasty_generalization: {
    patterns: ['always', 'never', 'everyone', 'no one', 'all people'],
    flaw: 'Hasty Generalization: Drawing broad conclusions from limited examples'
  },
  false_dichotomy: {
    patterns: ['only two', 'either or', 'no other option', 'only choice', 'must choose between'],
    flaw: 'False Dichotomy: Presenting only two options when more exist'
  },
  appeal_to_emotion: {
    patterns: ['feel strongly', 'heart says', 'gut tells', 'just know', 'sense that'],
    flaw: 'Appeal to Emotion: Using feelings as primary evidence for conclusions'
  },
  circular_reasoning: {
    patterns: ['because it is', 'obviously', 'clearly', 'self-evident', 'goes without saying'],
    flaw: 'Circular Reasoning: The conclusion is assumed in the premise'
  },
  ad_hominem: {
    patterns: ['they always', 'typical of', 'what do you expect from', 'thats just how they are'],
    flaw: 'Ad Hominem: Attacking character rather than addressing the argument'
  },
  slippery_slope: {
    patterns: ['will lead to', 'next thing', 'before you know it', 'inevitably', 'domino effect'],
    flaw: 'Slippery Slope: Assuming one event will trigger a chain of negative consequences without evidence'
  }
};

/**
 * Detect logical flaws in reasoning
 */
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

  // Add generic flaws based on text analysis
  const wordCount = text.split(/\s+/).length;
  
  if (wordCount < 20) {
    flaws.push('Insufficient Elaboration: Reasoning lacks detailed explanation of thought process');
  }
  
  if (!lowerText.includes('because') && !lowerText.includes('since') && !lowerText.includes('due to')) {
    flaws.push('Missing Causal Links: Conclusions not explicitly connected to supporting reasons');
  }

  return flaws.slice(0, 4);
}

/**
 * Generate bias analysis paragraph
 */
function generateBiasAnalysis(biases: { bias: string; description: string }[], category: string): string {
  if (biases.length === 0) {
    return `No obvious cognitive biases were detected in the reasoning provided. However, this doesn't mean none exist—biases can be subtle and difficult to identify in one's own thinking. Consider having someone with a different perspective review your reasoning for blind spots you might have missed. Pay particular attention to ${category}-related biases that commonly affect decisions in this domain.`;
  }

  const biasNames = biases.map(b => b.bias).join(', ');
  const primaryBias = biases[0];
  
  return `The reasoning shows potential signs of the following cognitive biases: ${biasNames}. The most prominent appears to be ${primaryBias.bias}, which involves ${primaryBias.description.toLowerCase()}. This pattern suggests that emotional or intuitive factors may be influencing the logical analysis. Consider whether you would reach the same conclusion if you approached this decision with fresh eyes and no prior assumptions. Actively seeking out information that contradicts your current view can help counterbalance these tendencies.`;
}

/**
 * Generate improvement suggestions for thinking
 */
function generateThinkingImprovements(
  reasoning: string, 
  conclusion: string,
  flaws: string[],
  biases: { bias: string; description: string }[]
): string[] {
  const improvements: string[] = [];
  const combined = (reasoning + ' ' + conclusion).toLowerCase();

  // Based on detected issues
  if (flaws.length > 0) {
    improvements.push('Explicitly state your assumptions and test each one for validity');
    improvements.push('Create a structured argument with clear premises leading to your conclusion');
  }

  if (biases.length > 0) {
    improvements.push('Seek out evidence that contradicts your current position');
    improvements.push('Ask someone with a different perspective to challenge your reasoning');
  }

  // Based on content analysis
  if (!combined.includes('alternative') && !combined.includes('other option')) {
    improvements.push('Document at least 2-3 alternative approaches and why you rejected them');
  }

  if (!combined.includes('risk') && !combined.includes('downside')) {
    improvements.push('Explicitly identify potential risks and how you would handle them');
  }

  if (!combined.includes('evidence') && !combined.includes('data') && !combined.includes('research')) {
    improvements.push('Gather objective data or evidence to support your key assumptions');
  }

  if (combined.length < 200) {
    improvements.push('Expand your reasoning with more detailed analysis of each factor');
  }

  // Add universal improvements
  improvements.push('Use the "steel man" technique: argue the strongest version of the opposing view');
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

    // Detect category
    const category = detectCategory(problem_statement);
    console.log(`Detected category: ${category}`);

    // Analyze reasoning
    const combinedText = `${user_reasoning} ${user_conclusion}`;
    
    // Detect logical flaws
    const logicalFlaws = detectLogicalFlaws(combinedText);
    console.log(`Detected logical flaws: ${logicalFlaws.length}`);

    // Detect cognitive biases
    const biases = detectBiases(combinedText);
    console.log(`Detected biases: ${biases.length}`);

    // Generate bias analysis
    const biasAnalysis = generateBiasAnalysis(biases, category);

    // Generate counter questions
    const counterQuestions = generateCounterQuestions(user_reasoning, user_conclusion, category);

    // Generate improvement suggestions
    const suggestedImprovements = generateThinkingImprovements(
      user_reasoning,
      user_conclusion,
      logicalFlaws,
      biases
    );

    const challenge = {
      logical_flaws: logicalFlaws,
      bias_analysis: biasAnalysis,
      counter_questions: counterQuestions,
      suggested_improvements: suggestedImprovements
    };

    console.log("Generated challenge:", challenge);
    return createSuccessResponse(challenge);

  } catch (error) {
    console.error("challenge-thinking error:", error);
    return createErrorResponse(error instanceof Error ? error.message : "Unknown error");
  }
});
