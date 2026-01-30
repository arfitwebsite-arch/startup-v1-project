import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, ArrowLeft, Loader2, AlertTriangle, Lightbulb, CheckCircle, Globe, Lock, Share2, Copy } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ExplanationData {
  id: string;
  question: string;
  answer: string;
  explanation: string;
  simple_summary: string | null;
  logical_strength_score: number | null;
  clarity_score: number | null;
  confidence_score: number | null;
  missing_assumptions: string[] | null;
  improvement_suggestions: string[] | null;
  subject: string | null;
  is_public: boolean;
  created_at: string;
}

const ViewExplanation = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  
  const [data, setData] = useState<ExplanationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchExplanation = async () => {
      if (!id) {
        navigate("/dashboard");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      const { data: explanation, error } = await supabase
        .from("explanations")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !explanation) {
        toast({
          title: "Explanation not found",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      // Parse JSON fields
      const parsedData: ExplanationData = {
        ...explanation,
        missing_assumptions: Array.isArray(explanation.missing_assumptions) 
          ? explanation.missing_assumptions as string[]
          : null,
        improvement_suggestions: Array.isArray(explanation.improvement_suggestions)
          ? explanation.improvement_suggestions as string[]
          : null,
      };

      setData(parsedData);
      setIsOwner(session?.user?.id === (explanation as any).user_id);
      setIsLoading(false);
    };

    fetchExplanation();
  }, [id, navigate, toast]);

  const copyShareLink = () => {
    if (data?.is_public) {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied!" });
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(isOwner ? "/history" : "/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              <span className="font-semibold text-lg">Analysis</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {data.is_public ? (
              <Badge variant="secondary" className="gap-1">
                <Globe className="h-3 w-3" />
                Public
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <Lock className="h-3 w-3" />
                Private
              </Badge>
            )}
            {data.is_public && (
              <Button variant="outline" size="sm" onClick={copyShareLink} className="gap-2">
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Meta */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{format(new Date(data.created_at), "MMMM d, yyyy")}</span>
          {data.subject && <Badge variant="outline">{data.subject}</Badge>}
        </div>

        {/* Question */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Question</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">{data.question}</p>
          </CardContent>
        </Card>

        {/* Answer */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">User's Reasoning</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-line">{data.answer}</p>
          </CardContent>
        </Card>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Logic</p>
              <p className={`text-3xl font-bold ${getScoreColor(data.logical_strength_score)}`}>
                {data.logical_strength_score ?? "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Clarity</p>
              <p className={`text-3xl font-bold ${getScoreColor(data.clarity_score)}`}>
                {data.clarity_score ?? "-"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Confidence</p>
              <p className={`text-3xl font-bold ${getScoreColor(data.confidence_score)}`}>
                {data.confidence_score ?? "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Summary */}
        {data.simple_summary && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground">{data.simple_summary}</p>
            </CardContent>
          </Card>
        )}

        {/* Explanation */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Step-by-Step Explanation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground whitespace-pre-line">{data.explanation}</p>
          </CardContent>
        </Card>

        {/* Missing Assumptions */}
        {data.missing_assumptions && data.missing_assumptions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Missing Assumptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.missing_assumptions.map((assumption, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-yellow-500 mt-1">•</span>
                    <span className="text-foreground">{assumption}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Improvement Suggestions */}
        {data.improvement_suggestions && data.improvement_suggestions.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                How to Improve
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {data.improvement_suggestions.map((suggestion, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span className="text-foreground">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ViewExplanation;
