/**
 * Rule-Based Text Analysis Utilities
 * Provides heuristic analysis without external AI dependencies
 */

// Decision categories and their keywords
export const DECISION_CATEGORIES = {
  career: ['job', 'work', 'career', 'promotion', 'salary', 'resign', 'quit', 'hire', 'interview', 'boss', 'colleague', 'office', 'remote', 'company', 'business', 'startup', 'freelance'],
  relationship: ['relationship', 'marry', 'marriage', 'date', 'dating', 'partner', 'spouse', 'divorce', 'breakup', 'love', 'friend', 'family', 'parent', 'child', 'sibling'],
  financial: ['money', 'invest', 'investment', 'save', 'spend', 'buy', 'purchase', 'sell', 'loan', 'debt', 'mortgage', 'rent', 'budget', 'stock', 'crypto', 'retire'],
  health: ['health', 'exercise', 'diet', 'weight', 'doctor', 'medical', 'surgery', 'therapy', 'mental', 'sleep', 'stress', 'medication', 'treatment', 'hospital'],
  education: ['study', 'college', 'university', 'degree', 'course', 'learn', 'school', 'exam', 'graduate', 'major', 'student', 'teacher', 'training'],
  lifestyle: ['move', 'relocate', 'travel', 'hobby', 'pet', 'home', 'apartment', 'house', 'city', 'country', 'lifestyle', 'habit'],
  technology: ['software', 'app', 'computer', 'phone', 'device', 'technology', 'programming', 'code', 'digital', 'online', 'internet'],
} as const;

export type DecisionCategory = keyof typeof DECISION_CATEGORIES;

/**
 * Detect the category of a decision based on keywords
 */
export function detectCategory(text: string): DecisionCategory {
  const lowerText = text.toLowerCase();
  const scores: Record<DecisionCategory, number> = {
    career: 0, relationship: 0, financial: 0, health: 0,
    education: 0, lifestyle: 0, technology: 0
  };

  for (const [category, keywords] of Object.entries(DECISION_CATEGORIES)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[category as DecisionCategory]++;
      }
    }
  }

  const maxCategory = Object.entries(scores).reduce((a, b) => 
    b[1] > a[1] ? b : a
  );

  return maxCategory[1] > 0 ? maxCategory[0] as DecisionCategory : 'lifestyle';
}

// Cognitive bias patterns
export const BIAS_PATTERNS = {
  confirmation_bias: {
    name: 'Confirmation Bias',
    patterns: ['i knew', 'proves that', 'obviously', 'clearly shows', 'as expected', 'always'],
    description: 'Tendency to favor information that confirms existing beliefs'
  },
  sunk_cost: {
    name: 'Sunk Cost Fallacy',
    patterns: ['already invested', 'spent so much', 'come this far', 'too late to', 'wasted if', 'put in so much'],
    description: 'Continuing due to past investment rather than future value'
  },
  anchoring: {
    name: 'Anchoring Bias',
    patterns: ['first impression', 'initial', 'originally', 'started at', 'began with'],
    description: 'Over-relying on the first piece of information encountered'
  },
  availability: {
    name: 'Availability Heuristic',
    patterns: ['heard about', 'read that', 'someone told me', 'saw on', 'recently'],
    description: 'Overweighting easily recalled information'
  },
  emotional: {
    name: 'Emotional Reasoning',
    patterns: ['feel like', 'gut feeling', 'instinct', 'heart says', 'just know', 'sense that'],
    description: 'Using emotions as evidence for truth'
  },
  black_white: {
    name: 'Black-and-White Thinking',
    patterns: ['only option', 'no choice', 'must', 'have to', 'either', 'or nothing', 'all or nothing'],
    description: 'Seeing situations in extremes without middle ground'
  },
  social_proof: {
    name: 'Social Proof Bias',
    patterns: ['everyone', 'most people', 'others are', 'popular', 'common', 'normal'],
    description: 'Following the crowd without independent evaluation'
  },
  optimism: {
    name: 'Optimism Bias',
    patterns: ['will definitely', 'guaranteed', 'certainly', 'no way', 'impossible to fail', 'cant go wrong'],
    description: 'Overestimating positive outcomes while underestimating risks'
  }
} as const;

/**
 * Detect cognitive biases in text
 */
export function detectBiases(text: string): { bias: string; description: string }[] {
  const lowerText = text.toLowerCase();
  const detected: { bias: string; description: string }[] = [];

  for (const [, biasInfo] of Object.entries(BIAS_PATTERNS)) {
    for (const pattern of biasInfo.patterns) {
      if (lowerText.includes(pattern)) {
        detected.push({ bias: biasInfo.name, description: biasInfo.description });
        break;
      }
    }
  }

  return detected;
}

// Logical indicators
const LOGICAL_INDICATORS = {
  positive: ['because', 'therefore', 'thus', 'since', 'as a result', 'consequently', 'due to', 'given that', 'considering', 'weighing', 'analyzed', 'evaluated', 'compared', 'research', 'data', 'evidence', 'facts', 'statistics'],
  negative: ['maybe', 'probably', 'might', 'could be', 'not sure', 'dont know', 'guess', 'hope', 'wish', 'assume', 'whatever', 'somehow']
};

const CLARITY_INDICATORS = {
  positive: ['specifically', 'precisely', 'exactly', 'clearly', 'firstly', 'secondly', 'in summary', 'to conclude', 'main reason', 'key factor', 'primary', 'the goal', 'objective'],
  negative: ['kind of', 'sort of', 'like', 'stuff', 'thing', 'whatever', 'etc', 'and so on', 'you know', 'basically']
};

/**
 * Calculate heuristic scores for text quality
 */
export function calculateScores(text: string): {
  logicalStrength: number;
  clarity: number;
  confidence: number;
} {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
  
  // Base scores
  let logicalScore = 50;
  let clarityScore = 50;
  
  // Logical strength scoring
  for (const indicator of LOGICAL_INDICATORS.positive) {
    if (lowerText.includes(indicator)) logicalScore += 5;
  }
  for (const indicator of LOGICAL_INDICATORS.negative) {
    if (lowerText.includes(indicator)) logicalScore -= 5;
  }
  
  // Clarity scoring
  for (const indicator of CLARITY_INDICATORS.positive) {
    if (lowerText.includes(indicator)) clarityScore += 5;
  }
  for (const indicator of CLARITY_INDICATORS.negative) {
    if (lowerText.includes(indicator)) clarityScore -= 5;
  }
  
  // Length bonuses (encourage detailed explanations)
  if (wordCount > 30) logicalScore += 5;
  if (wordCount > 60) logicalScore += 5;
  if (wordCount > 100) logicalScore += 5;
  
  // Sentence structure (multiple sentences suggest structured thinking)
  if (sentenceCount > 2) clarityScore += 5;
  if (sentenceCount > 4) clarityScore += 5;
  
  // Detect biases (reduces logical score)
  const biases = detectBiases(text);
  logicalScore -= biases.length * 8;
  
  // Clamp scores
  logicalScore = Math.max(15, Math.min(95, logicalScore));
  clarityScore = Math.max(15, Math.min(95, clarityScore));
  
  // Confidence is average of both with slight reduction
  const confidence = Math.round((logicalScore + clarityScore) / 2 * 0.9);
  
  return {
    logicalStrength: Math.round(logicalScore),
    clarity: Math.round(clarityScore),
    confidence: Math.max(20, Math.min(90, confidence))
  };
}

/**
 * Extract potential missing assumptions based on category
 */
export function extractMissingAssumptions(text: string, category: DecisionCategory): string[] {
  const assumptions: Record<DecisionCategory, string[]> = {
    career: [
      'Current job market conditions in your field',
      'Long-term career trajectory implications',
      'Impact on work-life balance',
      'Financial stability during transition period',
      'Skills gap that may need addressing'
    ],
    relationship: [
      'Long-term compatibility factors',
      'Communication patterns and conflict resolution',
      'Individual growth and personal goals alignment',
      'External pressures (family, social expectations)',
      'Financial and lifestyle compatibility'
    ],
    financial: [
      'Emergency fund adequacy',
      'Opportunity cost of this investment',
      'Tax implications',
      'Risk tolerance alignment',
      'Long-term financial goals impact'
    ],
    health: [
      'Second medical opinion consideration',
      'Long-term lifestyle sustainability',
      'Mental health impact',
      'Support system availability',
      'Recovery time and resources needed'
    ],
    education: [
      'Return on investment for this education path',
      'Alternative learning options',
      'Industry demand for this qualification',
      'Time commitment vs other priorities',
      'Practical application opportunities'
    ],
    lifestyle: [
      'Long-term sustainability of this choice',
      'Impact on relationships and social connections',
      'Financial implications over time',
      'Reversibility of this decision',
      'Alignment with core values and goals'
    ],
    technology: [
      'Learning curve and adaptation time',
      'Long-term support and updates',
      'Security and privacy implications',
      'Integration with existing systems',
      'Cost of maintenance and upgrades'
    ]
  };

  const lowerText = text.toLowerCase();
  const categoryAssumptions = assumptions[category];
  
  // Return assumptions not already addressed in the text
  return categoryAssumptions.filter(assumption => {
    const keywords = assumption.toLowerCase().split(' ').filter(w => w.length > 4);
    return !keywords.some(keyword => lowerText.includes(keyword));
  }).slice(0, 3);
}

/**
 * Generate improvement suggestions based on detected issues
 */
export function generateImprovements(text: string, scores: { logicalStrength: number; clarity: number }): string[] {
  const improvements: string[] = [];
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;
  
  if (scores.logicalStrength < 60) {
    improvements.push('Include specific evidence or data to support your reasoning');
    improvements.push('Explain the cause-and-effect relationship more explicitly');
  }
  
  if (scores.clarity < 60) {
    improvements.push('Structure your explanation with clear steps or points');
    improvements.push('Avoid vague language and be more specific');
  }
  
  if (wordCount < 30) {
    improvements.push('Provide more detail about the factors you considered');
  }
  
  if (!lowerText.includes('because') && !lowerText.includes('since') && !lowerText.includes('due to')) {
    improvements.push('Explicitly state the "why" behind your decision');
  }
  
  const biases = detectBiases(text);
  if (biases.length > 0) {
    improvements.push('Consider whether emotional factors are influencing your logic');
    improvements.push('Look for evidence that might contradict your current view');
  }
  
  if (!lowerText.includes('alternative') && !lowerText.includes('other option') && !lowerText.includes('considered')) {
    improvements.push('Document what alternatives you considered and why you rejected them');
  }
  
  return improvements.slice(0, 4);
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export function createErrorResponse(message: string, status: number = 500) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

export function createSuccessResponse(data: unknown) {
  return new Response(
    JSON.stringify(data),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
