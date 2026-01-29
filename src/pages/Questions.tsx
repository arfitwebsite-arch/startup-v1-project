import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Questions = () => {
  const [searchParams] = useSearchParams();
  const decisionId = searchParams.get("decision_id");
  
  const [decision, setDecision] = useState<{ id: string; decision_text: string } | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState<{ question: string; answer: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }
      
      if (!decisionId) {
        navigate("/new-decision");
        return;
      }

      // Fetch decision
      const { data: decisionData, error: decisionError } = await supabase
        .from("decisions")
        .select("id, decision_text")
        .eq("id", decisionId)
        .single();

      if (decisionError || !decisionData) {
        toast({
          title: "Decision not found",
          description: "Please create a new decision.",
          variant: "destructive",
        });
        navigate("/new-decision");
        return;
      }

      setDecision(decisionData);
      
      // Generate questions via edge function
      try {
        const response = await supabase.functions.invoke("generate-questions", {
          body: { decision_text: decisionData.decision_text },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to generate questions");
        }

        const generatedQuestions = response.data?.questions || [];
        if (generatedQuestions.length === 0) {
          throw new Error("No questions generated");
        }

        setQuestions(generatedQuestions);
      } catch (error) {
        toast({
          title: "Error generating questions",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
        navigate("/new-decision");
        return;
      }

      setIsLoading(false);
    };

    checkAuth();
  }, [decisionId, navigate, toast]);

  const handleNext = async () => {
    if (!answer.trim()) {
      toast({
        title: "Answer required",
        description: "Please provide an answer.",
        variant: "destructive",
      });
      return;
    }

    const currentQuestion = questions[currentIndex];
    const newAnswers = [...answers, { question: currentQuestion, answer: answer.trim() }];
    setAnswers(newAnswers);
    setAnswer("");

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Save all answers and navigate to explanation
      setIsSubmitting(true);

      try {
        const answersToInsert = newAnswers.map((a) => ({
          decision_id: decisionId,
          question: a.question,
          answer: a.answer,
        }));

        const { error } = await supabase.from("decision_answers").insert(answersToInsert);

        if (error) throw error;

        navigate(`/explanation?decision_id=${decisionId}`);
      } catch (error) {
        toast({
          title: "Error saving answers",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Generating questions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardDescription className="text-xs">
            Question {currentIndex + 1} of {questions.length}
          </CardDescription>
          <CardTitle className="text-lg">{questions[currentIndex]}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={isSubmitting}
            rows={4}
            className="resize-none"
          />
          <Button
            onClick={handleNext}
            className="w-full"
            disabled={isSubmitting || !answer.trim()}
          >
            {isSubmitting
              ? "Saving..."
              : currentIndex < questions.length - 1
              ? "Next"
              : "Get Explanation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Questions;
