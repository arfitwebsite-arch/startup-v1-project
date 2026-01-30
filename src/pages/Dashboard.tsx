import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, TrendingUp, History, LogOut, Plus, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface Explanation {
  id: string;
  logical_strength_score: number | null;
  clarity_score: number | null;
  confidence_score: number | null;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState<string>("");
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }

      setUserName(session.user.email?.split("@")[0] || "User");

      const { data, error } = await supabase
        .from("explanations")
        .select("id, logical_strength_score, clarity_score, confidence_score, created_at")
        .order("created_at", { ascending: false })
        .limit(50);

      if (!error && data) {
        setExplanations(data);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // Calculate stats
  const validExplanations = explanations.filter(
    (e) => e.logical_strength_score !== null && e.clarity_score !== null
  );

  const avgLogic = validExplanations.length > 0
    ? Math.round(validExplanations.reduce((sum, e) => sum + (e.logical_strength_score || 0), 0) / validExplanations.length)
    : 0;

  const avgClarity = validExplanations.length > 0
    ? Math.round(validExplanations.reduce((sum, e) => sum + (e.clarity_score || 0), 0) / validExplanations.length)
    : 0;

  const avgConfidence = validExplanations.length > 0
    ? Math.round(validExplanations.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / validExplanations.length)
    : 0;

  const decisionIntelligenceScore = Math.round((avgLogic + avgClarity) / 2);

  // Chart data (last 10 entries, reversed for chronological order)
  const chartData = validExplanations
    .slice(0, 10)
    .reverse()
    .map((e, i) => ({
      name: `#${i + 1}`,
      logic: e.logical_strength_score || 0,
      clarity: e.clarity_score || 0,
      confidence: e.confidence_score || 0,
    }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Explain My Decision</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="gap-2">
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {userName}</h1>
          <p className="text-muted-foreground">Here's your decision intelligence overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Decision IQ</span>
              </div>
              <p className="text-3xl font-bold text-primary">{decisionIntelligenceScore}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Logic</span>
              </div>
              <p className="text-3xl font-bold">{avgLogic}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Avg Clarity</span>
              </div>
              <p className="text-3xl font-bold">{avgClarity}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Confidence</span>
              </div>
              <p className="text-3xl font-bold">{avgConfidence}</p>
            </CardContent>
          </Card>
        </div>

        {/* Trend Chart */}
        {chartData.length > 1 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Score Trends (Last 10)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" stroke="#888" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="logic"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                      name="Logic"
                    />
                    <Line
                      type="monotone"
                      dataKey="clarity"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-2))" }}
                      name="Clarity"
                    />
                    <Line
                      type="monotone"
                      dataKey="confidence"
                      stroke="hsl(var(--chart-3))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--chart-3))" }}
                      name="Confidence"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/new-explanation")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">New Explanation</h3>
                <p className="text-sm text-muted-foreground">Analyze a new decision</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/challenge")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Challenge My Thinking</h3>
                <p className="text-sm text-muted-foreground">Test your reasoning</p>
              </div>
            </CardContent>
          </Card>
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => navigate("/history")}
          >
            <CardContent className="p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <History className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">View History</h3>
                <p className="text-sm text-muted-foreground">See past analyses</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Empty State */}
        {explanations.length === 0 && (
          <Card className="mt-8 text-center p-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analyses yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by analyzing your first decision to build your Decision IQ.
            </p>
            <Button onClick={() => navigate("/new-explanation")}>
              Create Your First Analysis
            </Button>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
