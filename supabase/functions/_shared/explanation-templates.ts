/**
 * Explanation Generation Templates
 * Creates neutral, non-advisory explanations based on user input
 */

import { DecisionCategory } from "./text-analysis.ts";

interface Answer {
  question: string;
  answer: string;
}

/**
 * Extract key themes from text
 */
function extractThemes(text: string): string[] {
  const themes: string[] = [];
  const lowerText = text.toLowerCase();
  
  const themePatterns: Record<string, string> = {
    'financial': 'financial considerations',
    'money': 'monetary factors',
    'time': 'time constraints',
    'family': 'family dynamics',
    'career': 'career implications',
    'health': 'health concerns',
    'stress': 'stress levels',
    'growth': 'personal growth',
    'opportunity': 'opportunity assessment',
    'risk': 'risk evaluation',
    'security': 'security needs',
    'freedom': 'desire for freedom',
    'stability': 'need for stability',
    'passion': 'passion and interest',
    'values': 'personal values'
  };
  
  for (const [keyword, theme] of Object.entries(themePatterns)) {
    if (lowerText.includes(keyword) && !themes.includes(theme)) {
      themes.push(theme);
    }
  }
  
  return themes.slice(0, 3);
}

/**
 * Generate a neutral explanation based on decision and answers
 */
export function generateExplanation(
  decisionText: string,
  answers: Answer[],
  category: DecisionCategory
): string {
  const themes = extractThemes(decisionText + ' ' + answers.map(a => a.answer).join(' '));
  
  // Build explanation parts
  const parts: string[] = [];
  
  // Opening statement
  const openings: Record<DecisionCategory, string[]> = {
    career: [
      `You made this career decision based on your assessment of professional growth and current circumstances.`,
      `This career choice reflects your evaluation of available opportunities and personal priorities.`
    ],
    relationship: [
      `This relationship decision stems from your understanding of the dynamics involved and your emotional needs.`,
      `You reached this conclusion by weighing the relationship factors that matter most to you.`
    ],
    financial: [
      `This financial decision reflects your analysis of monetary factors and risk tolerance.`,
      `You based this choice on your financial situation and future monetary goals.`
    ],
    health: [
      `This health-related decision comes from your evaluation of wellbeing priorities and available options.`,
      `You made this health choice by considering your physical and mental wellness needs.`
    ],
    education: [
      `This educational decision reflects your assessment of learning goals and career trajectory.`,
      `You chose this path based on your evaluation of educational value and future applications.`
    ],
    lifestyle: [
      `This lifestyle decision reflects your priorities and how you want to structure your daily life.`,
      `You made this choice based on what aligns with your vision of how you want to live.`
    ],
    technology: [
      `This technology decision reflects your assessment of functional needs and practical considerations.`,
      `You based this choice on evaluating how this technology fits your requirements and workflow.`
    ]
  };
  
  parts.push(openings[category][Math.floor(Math.random() * openings[category].length)]);
  
  // Add theme-based sentences
  if (themes.length > 0) {
    parts.push(`Key factors in your reasoning include ${themes.join(', ')}.`);
  }
  
  // Add answer-based insights (without advice)
  if (answers.length > 0) {
    const answerInsights = answers.slice(0, 2).map(a => {
      const shortAnswer = a.answer.length > 100 ? a.answer.substring(0, 100) + '...' : a.answer;
      return `When asked "${a.question.replace(/\?$/, '')}", you indicated: "${shortAnswer}"`;
    });
    parts.push(answerInsights.join(' '));
  }
  
  // Closing statement (neutral, no advice)
  const closings = [
    `This decision represents your current understanding of the situation and available information.`,
    `Your reasoning reflects the priorities and constraints you identified at this time.`,
    `This conclusion follows from the factors you determined to be most relevant.`
  ];
  
  parts.push(closings[Math.floor(Math.random() * closings.length)]);
  
  return parts.join('\n\n');
}

/**
 * Generate a simple summary of the explanation
 */
export function generateSummary(decisionText: string, category: DecisionCategory): string {
  const summaryTemplates: Record<DecisionCategory, string[]> = {
    career: [
      `This career decision was made after weighing professional growth against current stability.`,
      `The choice reflects a balance between career aspirations and practical circumstances.`
    ],
    relationship: [
      `This relationship decision emerged from evaluating emotional needs and interpersonal dynamics.`,
      `The choice reflects priorities around connection, boundaries, and personal wellbeing.`
    ],
    financial: [
      `This financial decision balances potential returns against acceptable risk levels.`,
      `The choice reflects current financial position and future monetary objectives.`
    ],
    health: [
      `This health decision prioritizes specific wellness goals within current constraints.`,
      `The choice reflects a balance between health outcomes and lifestyle sustainability.`
    ],
    education: [
      `This educational decision weighs learning investment against expected career returns.`,
      `The choice reflects goals around skill development and professional advancement.`
    ],
    lifestyle: [
      `This lifestyle decision reflects personal values and desired quality of life.`,
      `The choice balances immediate preferences with longer-term life goals.`
    ],
    technology: [
      `This technology decision addresses specific functional needs within practical constraints.`,
      `The choice reflects requirements for efficiency, capability, and future scalability.`
    ]
  };
  
  const templates = summaryTemplates[category];
  return templates[Math.floor(Math.random() * templates.length)];
}

/**
 * Generate step-by-step explanation of reasoning
 */
export function generateStepByStep(
  decisionText: string,
  answers: Answer[],
  category: DecisionCategory
): string {
  const steps: string[] = [];
  
  steps.push(`1. **Initial Assessment**: You identified a decision point regarding ${category}-related matters.`);
  
  if (answers.length > 0) {
    steps.push(`2. **Factor Identification**: You considered ${answers.length} key factors through self-reflection.`);
    
    answers.forEach((answer, index) => {
      const condensed = answer.answer.length > 80 
        ? answer.answer.substring(0, 80) + '...' 
        : answer.answer;
      steps.push(`${index + 3}. **${answer.question.replace(/\?$/, '')}**: Your response indicates: "${condensed}"`);
    });
  }
  
  steps.push(`${steps.length + 1}. **Conclusion Reached**: Based on these factors, you arrived at your stated decision.`);
  
  return steps.join('\n\n');
}
