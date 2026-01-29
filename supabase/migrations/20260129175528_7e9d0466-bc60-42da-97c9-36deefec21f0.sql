-- Create decisions table
CREATE TABLE public.decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decision_answers table
CREATE TABLE public.decision_answers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create decision_explanations table
CREATE TABLE public.decision_explanations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
  explanation TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_explanations ENABLE ROW LEVEL SECURITY;

-- RLS policies for decisions
CREATE POLICY "Users can view their own decisions" 
ON public.decisions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own decisions" 
ON public.decisions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own decisions" 
ON public.decisions FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for decision_answers (via decision ownership)
CREATE POLICY "Users can view answers for their decisions" 
ON public.decision_answers FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.decisions 
  WHERE decisions.id = decision_answers.decision_id 
  AND decisions.user_id = auth.uid()
));

CREATE POLICY "Users can create answers for their decisions" 
ON public.decision_answers FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.decisions 
  WHERE decisions.id = decision_answers.decision_id 
  AND decisions.user_id = auth.uid()
));

-- RLS policies for decision_explanations (via decision ownership)
CREATE POLICY "Users can view explanations for their decisions" 
ON public.decision_explanations FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.decisions 
  WHERE decisions.id = decision_explanations.decision_id 
  AND decisions.user_id = auth.uid()
));

CREATE POLICY "Users can create explanations for their decisions" 
ON public.decision_explanations FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.decisions 
  WHERE decisions.id = decision_explanations.decision_id 
  AND decisions.user_id = auth.uid()
));