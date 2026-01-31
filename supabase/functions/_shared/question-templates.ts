/**
 * Question Templates for Rule-Based Question Generation
 */

import { DecisionCategory } from "./text-analysis.ts";

// Generic questions that apply to any decision
const GENERIC_QUESTIONS = [
  "What alternatives did you consider before making this choice?",
  "What would need to change for you to reconsider this decision?",
  "Who else is affected by this decision and how?",
  "What is the worst-case scenario if this doesn't work out?",
  "What factors were most important in reaching this conclusion?",
  "How does this align with your long-term goals?",
  "What information would have helped you decide more confidently?",
  "What are you giving up by choosing this path?"
];

// Category-specific question templates
const CATEGORY_QUESTIONS: Record<DecisionCategory, string[]> = {
  career: [
    "How does this align with where you want to be in 5 years?",
    "What skills or experience will you gain or lose from this choice?",
    "How will this affect your work-life balance?",
    "What financial implications does this have short and long term?",
    "Have you spoken with people who made similar career moves?",
    "What would success look like in this new direction?"
  ],
  relationship: [
    "How have you communicated your needs in this situation?",
    "What patterns from past relationships might be influencing you?",
    "How does this decision reflect your core values?",
    "What boundaries are you setting or respecting with this choice?",
    "How might this look from the other person's perspective?",
    "What does your support system think about this decision?"
  ],
  financial: [
    "What is your timeline for seeing returns on this decision?",
    "How does this fit into your overall financial plan?",
    "What is your backup plan if this doesn't work out financially?",
    "Have you consulted with a financial professional about this?",
    "What opportunity costs are you accepting with this choice?",
    "How does this affect your financial security and risk tolerance?"
  ],
  health: [
    "Have you sought a second opinion on this health decision?",
    "How sustainable is this change in your daily life?",
    "What support systems do you have in place?",
    "How does this impact your mental and emotional wellbeing?",
    "What research have you done on alternatives or outcomes?",
    "How will you measure if this decision is working?"
  ],
  education: [
    "What specific outcomes do you expect from this educational investment?",
    "How does this credential translate to your career goals?",
    "What is the opportunity cost of time spent on this?",
    "Are there alternative paths to achieve the same goal?",
    "How will you apply what you learn in practice?",
    "What networking or connection opportunities does this provide?"
  ],
  lifestyle: [
    "How reversible is this decision if you change your mind?",
    "What daily habits will need to change because of this?",
    "How does this fit with the life you want to build?",
    "What are you trading off to make this change?",
    "How have similar changes worked out for you in the past?",
    "What does your ideal outcome look like in 1 year?"
  ],
  technology: [
    "What problem is this technology specifically solving for you?",
    "How does this integrate with your current systems and workflows?",
    "What is the learning curve and are you prepared for it?",
    "What are the security and privacy implications?",
    "How will this scale as your needs grow?",
    "What happens if this technology becomes obsolete or unsupported?"
  ]
};

// Action-based question modifiers
const ACTION_KEYWORDS: Record<string, string[]> = {
  quitting: ["What is pushing you away vs pulling you toward something new?", "What attempts have you made to improve the current situation?"],
  starting: ["What resources do you have in place to begin?", "What milestones will indicate you're on the right track?"],
  buying: ["Is this a need or a want, and how do you distinguish them?", "What happens if you wait 30 days before deciding?"],
  ending: ["What have you tried to repair or improve before ending?", "How will you know this was the right choice in hindsight?"],
  changing: ["What specific outcome are you hoping this change brings?", "What hasn't worked about previous attempts to change?"],
  accepting: ["What conditions or boundaries are you setting?", "How does this acceptance align with your values?"],
  rejecting: ["What would need to be different for you to accept?", "Are there parts of this you could accept while rejecting others?"]
};

/**
 * Generate relevant questions based on decision text
 */
export function generateQuestions(decisionText: string, category: DecisionCategory): string[] {
  const lowerText = decisionText.toLowerCase();
  const selectedQuestions: string[] = [];
  
  // Add action-based questions
  for (const [action, questions] of Object.entries(ACTION_KEYWORDS)) {
    if (lowerText.includes(action)) {
      selectedQuestions.push(...questions);
    }
  }
  
  // Add category-specific questions
  const categoryQuestions = CATEGORY_QUESTIONS[category];
  selectedQuestions.push(...categoryQuestions.slice(0, 2));
  
  // Fill remaining with generic questions
  const remaining = 3 - selectedQuestions.length;
  if (remaining > 0) {
    const shuffledGeneric = GENERIC_QUESTIONS.sort(() => Math.random() - 0.5);
    selectedQuestions.push(...shuffledGeneric.slice(0, remaining));
  }
  
  // Return exactly 3 unique questions
  const unique = [...new Set(selectedQuestions)];
  return unique.slice(0, 3);
}

/**
 * Generate counter-questions for challenging thinking
 */
export function generateCounterQuestions(reasoning: string, conclusion: string, category: DecisionCategory): string[] {
  const combined = (reasoning + " " + conclusion).toLowerCase();
  const counterQuestions: string[] = [];
  
  // Challenge absolutes
  if (combined.includes('always') || combined.includes('never') || combined.includes('everyone')) {
    counterQuestions.push("Are there any exceptions to this pattern you might be overlooking?");
  }
  
  // Challenge certainty
  if (combined.includes('definitely') || combined.includes('certainly') || combined.includes('guaranteed')) {
    counterQuestions.push("What evidence would convince you that you might be wrong?");
  }
  
  // Challenge emotional reasoning
  if (combined.includes('feel') || combined.includes('gut') || combined.includes('instinct')) {
    counterQuestions.push("If you removed the emotional component, what does the logic alone suggest?");
  }
  
  // Add category-specific challenges
  const categoryCounters: Record<DecisionCategory, string[]> = {
    career: ["What would a mentor or advisor say about this reasoning?", "How might this decision look from your future self's perspective?"],
    relationship: ["How might the other person describe this same situation?", "What role does your attachment style play in this analysis?"],
    financial: ["What would a financial advisor challenge in this reasoning?", "How does this decision perform in different economic scenarios?"],
    health: ["What does the medical evidence actually say about this?", "Are you weighing short-term comfort over long-term outcomes?"],
    education: ["What do successful people in your field say about this path?", "Is the credential or the learning more important here?"],
    lifestyle: ["How does this align with the person you want to become?", "What would you advise a friend in the same situation?"],
    technology: ["Are you solving the right problem with this technology?", "What would you do if this technology didn't exist?"]
  };
  
  counterQuestions.push(...categoryCounters[category]);
  
  // Add universal challenges
  counterQuestions.push("What information are you choosing to ignore or minimize?");
  counterQuestions.push("How would someone who disagrees with you argue their position?");
  
  return counterQuestions.slice(0, 5);
}
