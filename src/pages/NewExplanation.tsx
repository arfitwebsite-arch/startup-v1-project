import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, Loader2, AlertTriangle, Lightbulb, CheckCircle } from "lucide-react";

interface AnalysisResult {
  step_by_step_explanation: string;
  simple_summary: string;
  logical_strength_score: number;
  clarity_score: number;
  confidence_score: number;
  missing_assumptions: string[];
  improvement_suggestions: string[];
}

const SUBJECTS = [
  "Career",
  "Finance",
  "Relationships",
  "Health",
  "Education",
  "Business",
  "Technology",
  "Personal Growth",
  "Other",
];

const NewExplanation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [subject, setSubject] = useState("");
  const [language, setLanguage] = useState("en");
  const [isPublic, setIsPublic] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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

  const handleAnalyze = async () => {
    if (!question.trim() || !answer.trim()) {
      toast({
        title: "Please fill in both fields",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("analyze-explanation", {
        body: { question, answer, language, subject },
      });

      if (response.error) {
        throw new Error(response.error.message || "Analysis failed");
      }

      setResult(response.data);
    } catch (error) {
      toast({
        title: "Analysis failed",
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

    const { error } = await supabase.from("explanations").insert({
      user_id: userId,
      question,
      answer,
      explanation: result.step_by_step_explanation,
      simple_summary: result.simple_summary,
      logical_strength_score: result.logical_strength_score,
      clarity_score: result.clarity_score,
      confidence_score: result.confidence_score,
      missing_assumptions: result.missing_assumptions,
      improvement_suggestions: result.improvement_suggestions,
      subject,
      language,
      is_public: isPublic,
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

    toast({ title: "Analysis saved!" });
    navigate("/dashboard");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
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
            <span className="font-semibold text-lg">New Explanation</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle>Analyze Your Reasoning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="question">Question / Decision</Label>
                <Textarea
                  id="question"
                  placeholder="What decision are you trying to explain? e.g., 'Should I accept this job offer?'"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="answer">Your Answer / Reasoning</Label>
                <Textarea
                  id="answer"
                  placeholder="Explain your reasoning and conclusion..."
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={5}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
                <Label htmlFor="public">Make this analysis public</Label>
              </div>

              <Button
                onClick={handleAnalyze}
                className="w-full"
                disabled={isAnalyzing || !question.trim() || !answer.trim()}
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Analyze My Reasoning"
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Scores */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Logic</p>
                  <p className={`text-3xl font-bold ${getScoreColor(result.logical_strength_score)}`}>
                    {result.logical_strength_score}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Clarity</p>
                  <p className={`text-3xl font-bold ${getScoreColor(result.clarity_score)}`}>
                    {result.clarity_score}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Confidence</p>
                  <p className={`text-3xl font-bold ${getScoreColor(result.confidence_score)}`}>
                    {result.confidence_score}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Simple Summary */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-primary" />
                  Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground">{result.simple_summary}</p>
              </CardContent>
            </Card>

            {/* Step by Step */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Step-by-Step Explanation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-line">{result.step_by_step_explanation}</p>
              </CardContent>
            </Card>

            {/* Missing Assumptions */}
            {result.missing_assumptions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    Missing Assumptions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.missing_assumptions.map((assumption, i) => (
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
            {result.improvement_suggestions.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    How to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.improvement_suggestions.map((suggestion, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-foreground">{suggestion}</span>
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
                  "Save Analysis"
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default NewExplanation;
