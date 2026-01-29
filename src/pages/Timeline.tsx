import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface DecisionWithExplanation {
  id: string;
  decision_text: string;
  created_at: string;
  explanation: string | null;
}

const Timeline = () => {
  const [decisions, setDecisions] = useState<DecisionWithExplanation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDecisions = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }

      const { data: decisionsData } = await supabase
        .from("decisions")
        .select("id, decision_text, created_at")
        .order("created_at", { ascending: false });

      if (!decisionsData) {
        setIsLoading(false);
        return;
      }

      // Fetch explanations for each decision
      const decisionsWithExplanations = await Promise.all(
        decisionsData.map(async (d) => {
          const { data: explanationData } = await supabase
            .from("decision_explanations")
            .select("explanation")
            .eq("decision_id", d.id)
            .single();

          return {
            ...d,
            explanation: explanationData?.explanation || null,
          };
        })
      );

      setDecisions(decisionsWithExplanations);
      setIsLoading(false);
    };

    fetchDecisions();
  }, [navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const selectedDecision = decisions.find((d) => d.id === selectedId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Your Decisions</h1>
        <Button variant="secondary" onClick={() => navigate("/new-decision")}>
          New
        </Button>
      </div>

      {selectedDecision ? (
        <Card>
          <CardHeader>
            <CardDescription className="text-xs">
              {formatDate(selectedDecision.created_at)}
            </CardDescription>
            <CardTitle className="text-base">{selectedDecision.decision_text}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedDecision.explanation ? (
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {selectedDecision.explanation}
              </p>
            ) : (
              <p className="text-muted-foreground">No explanation saved.</p>
            )}
            <Button
              variant="secondary"
              onClick={() => setSelectedId(null)}
              className="w-full"
            >
              Back to list
            </Button>
          </CardContent>
        </Card>
      ) : decisions.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No decisions yet.</p>
          <Button onClick={() => navigate("/new-decision")}>
            Make your first decision
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((d) => (
            <Card
              key={d.id}
              className="cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => setSelectedId(d.id)}
            >
              <CardContent className="py-4">
                <p className="text-xs text-muted-foreground mb-1">
                  {formatDate(d.created_at)}
                </p>
                <p className="text-sm line-clamp-2">{d.decision_text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Timeline;
