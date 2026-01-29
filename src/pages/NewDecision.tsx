import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const NewDecision = () => {
  const [decisionText, setDecisionText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session?.user) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/login");
      } else {
        setUserId(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!decisionText.trim()) {
      toast({
        title: "Decision required",
        description: "Please describe your decision.",
        variant: "destructive",
      });
      return;
    }

    if (!userId) {
      toast({
        title: "Not authenticated",
        description: "Please log in again.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from("decisions")
      .insert({ decision_text: decisionText.trim(), user_id: userId })
      .select()
      .single();

    setIsLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    navigate(`/questions?decision_id=${data.id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>What decision did you make?</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Describe the decision you made..."
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              disabled={isLoading}
              rows={5}
              className="resize-none"
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading || !decisionText.trim()}
            >
              {isLoading ? "Saving..." : "Explain this decision"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewDecision;
