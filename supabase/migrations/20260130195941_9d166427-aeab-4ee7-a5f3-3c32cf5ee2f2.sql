-- Create new explanations table with all scoring fields
CREATE TABLE public.explanations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  explanation TEXT NOT NULL,
  simple_summary TEXT,
  logical_strength_score INTEGER CHECK (logical_strength_score >= 0 AND logical_strength_score <= 100),
  clarity_score INTEGER CHECK (clarity_score >= 0 AND clarity_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  missing_assumptions JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  subject TEXT,
  language TEXT DEFAULT 'en',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;

-- Users can view their own explanations
CREATE POLICY "Users can view their own explanations"
ON public.explanations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own explanations
CREATE POLICY "Users can create their own explanations"
ON public.explanations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own explanations
CREATE POLICY "Users can update their own explanations"
ON public.explanations
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own explanations
CREATE POLICY "Users can delete their own explanations"
ON public.explanations
FOR DELETE
USING (auth.uid() = user_id);

-- Anyone can view public explanations
CREATE POLICY "Anyone can view public explanations"
ON public.explanations
FOR SELECT
USING (is_public = true);

-- Create challenge_thinking table for the challenge mode
CREATE TABLE public.challenge_thinking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  problem_statement TEXT NOT NULL,
  user_reasoning TEXT NOT NULL,
  user_conclusion TEXT NOT NULL,
  logical_flaws JSONB DEFAULT '[]'::jsonb,
  bias_analysis TEXT,
  counter_questions JSONB DEFAULT '[]'::jsonb,
  suggested_improvements JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.challenge_thinking ENABLE ROW LEVEL SECURITY;

-- Users can view their own challenges
CREATE POLICY "Users can view their own challenges"
ON public.challenge_thinking
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own challenges
CREATE POLICY "Users can create their own challenges"
ON public.challenge_thinking
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own challenges
CREATE POLICY "Users can delete their own challenges"
ON public.challenge_thinking
FOR DELETE
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_explanations_user_id ON public.explanations(user_id);
CREATE INDEX idx_explanations_created_at ON public.explanations(created_at DESC);
CREATE INDEX idx_explanations_is_public ON public.explanations(is_public) WHERE is_public = true;
CREATE INDEX idx_challenge_thinking_user_id ON public.challenge_thinking(user_id);