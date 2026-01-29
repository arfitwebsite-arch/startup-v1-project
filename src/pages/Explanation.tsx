import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Explanation = () => {
  const [searchParams] = useSearchParams();
  const decisionId = searchParams.get("decision_id");
  
  const [explanation, setExplanation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndGenerate = async () => {
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
        .select("decision_text")
        .eq("id", decisionId)
        .single();

      if (decisionError || !decisionData) {
        toast({
          title: "Decision not found",
          variant: "destructive",
        });
        navigate("/new-decision");
        return;
      }

      // Fetch answers
      const { data: answersData, error: answersError } = await supabase
        .from("decision_answers")
        .select("question, answer")
        .eq("decision_id", decisionId);

      if (answersError) {
        toast({
          title: "Error fetching answers",
          variant: "destructive",
        });
        navigate("/new-decision");
        return;
      }

      // Generate explanation
      try {
        const response = await supabase.functions.invoke("generate-explanation", {
          body: {
            decision_text: decisionData.decision_text,
            answers: answersData || [],
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "Failed to generate explanation");
        }

        const generatedExplanation = response.data?.explanation || "";
        if (!generatedExplanation) {
          throw new Error("No explanation generated");
        }

        setExplanation(generatedExplanation);
      } catch (error) {
        toast({
          title: "Error generating explanation",
          description: error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
        navigate("/new-decision");
        return;
      }

      setIsLoading(false);
    };

    fetchAndGenerate();
  }, [decisionId, navigate, toast]);

  const handleSave = async () => {
    setIsSaving(true);

    const { error } = await supabase
      .from("decision_explanations")
      .insert({ decision_id: decisionId, explanation });

    if (error) {
      toast({
        title: "Error saving explanation",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    navigate("/timeline");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Generating explanation...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Why you made this decision</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {explanation}
          </p>
          <Button
            onClick={handleSave}
            className="w-full"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Explanation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Explanation;
