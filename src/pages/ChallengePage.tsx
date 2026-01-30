import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, Loader2, AlertCircle, HelpCircle, Lightbulb, Scale } from "lucide-react";

interface ChallengeResult {
  logical_flaws: string[];
  bias_analysis: string;
  counter_questions: string[];
  suggested_improvements: string[];
}

const ChallengePage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [problemStatement, setProblemStatement] = useState("");
  const [userReasoning, setUserReasoning] = useState("");
  const [userConclusion, setUserConclusion] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }
      setUserId(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const handleChallenge = async () => {
    if (!problemStatement.trim() || !userReasoning.trim() || !userConclusion.trim()) {
      toast({
        title: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("challenge-thinking", {
        body: {
          problem_statement: problemStatement,
          user_reasoning: userReasoning,
          user_conclusion: userConclusion,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Challenge failed");
      }

      setResult(response.data);
    } catch (error) {
      toast({
        title: "Challenge failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!result || !userId) return;

    setIsSaving(true);

    const { error } = await supabase.from("challenge_thinking").insert({
      user_id: userId,
      problem_statement: problemStatement,
      user_reasoning: userReasoning,
      user_conclusion: userConclusion,
      logical_flaws: result.logical_flaws,
      bias_analysis: result.bias_analysis,
      counter_questions: result.counter_questions,
      suggested_improvements: result.suggested_improvements,
    });

    if (error) {
      toast({
        title: "Failed to save",
        description: error.message,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    toast({ title: "Challenge saved!" });
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Challenge My Thinking</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Test Your Reasoning</CardTitle>
              <p className="text-muted-foreground text-sm">
                This mode challenges your thinking without giving you answers.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="problem">Problem Statement</Label>
                <Textarea
                  id="problem"
                  placeholder="Describe the problem or decision you're facing..."
                  value={problemStatement}
                  onChange={(e) => setProblemStatement(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reasoning">Your Reasoning</Label>
                <Textarea
                  id="reasoning"
                  placeholder="Walk through your thought process step by step..."
                  value={userReasoning}
                  onChange={(e) => setUserReasoning(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="conclusion">Your Conclusion</Label>
                <Textarea
                  id="conclusion"
                  placeholder="What did you decide and why?"
                  value={userConclusion}
                  onChange={(e) => setUserConclusion(e.target.value)}
                  rows={3}
                />
              </div>

              <Button
                onClick={handleChallenge}
                className="w-full"
                disabled={isAnalyzing || !problemStatement.trim() || !userReasoning.trim() || !userConclusion.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Challenging...
                  </>
                ) : (
                  "Challenge My Thinking"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Logical Flaws */}
            {result.logical_flaws.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    Logical Flaws Detected
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.logical_flaws.map((flaw, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-500 mt-1">•</span>
                        <span className="text-foreground">{flaw}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Bias Analysis */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Scale className="h-5 w-5 text-yellow-500" />
                  Bias Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{result.bias_analysis}</p>
              </CardContent>
            </Card>

            {/* Counter Questions */}
            {result.counter_questions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-500" />
                    Questions to Consider
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.counter_questions.map((question, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 font-semibold">{i + 1}.</span>
                        <span className="text-foreground">{question}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Suggested Improvements */}
            {result.suggested_improvements.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Strengthen Your Reasoning
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.suggested_improvements.map((improvement, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-foreground">{improvement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => setResult(null)}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Challenge"
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChallengePage;
