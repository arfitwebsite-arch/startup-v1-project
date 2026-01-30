import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Brain, ArrowLeft, Trash2, Eye, Globe, Lock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Explanation {
  id: string;
  question: string;
  logical_strength_score: number | null;
  clarity_score: number | null;
  is_public: boolean;
  created_at: string;
}

const HistoryPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("explanations")
        .select("id, question, logical_strength_score, clarity_score, is_public, created_at")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setExplanations(data);
      }

      setIsLoading(false);
    };

    fetchHistory();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    const { error } = await supabase
      .from("explanations")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Failed to delete",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExplanations((prev) => prev.filter((e) => e.id !== id));
      toast({ title: "Deleted successfully" });
    }

    setDeletingId(null);
  };

  const togglePublic = async (id: string, currentValue: boolean) => {
    const { error } = await supabase
      .from("explanations")
      .update({ is_public: !currentValue })
      .eq("id", id);

    if (error) {
      toast({
        title: "Failed to update",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setExplanations((prev) =>
        prev.map((e) => (e.id === id ? { ...e, is_public: !currentValue } : e))
      );
      toast({ title: !currentValue ? "Made public" : "Made private" });
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
            <span className="font-semibold text-lg">History</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {explanations.length === 0 ? (
          <Card className="text-center p-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No history yet</h3>
            <p className="text-muted-foreground mb-4">
              Your saved analyses will appear here.
            </p>
            <Button onClick={() => navigate("/new-explanation")}>
              Create Your First Analysis
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {explanations.map((exp) => (
              <Card key={exp.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate mb-2">{exp.question}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground">
                          {format(new Date(exp.created_at), "MMM d, yyyy")}
                        </span>
                        <span className={getScoreColor(exp.logical_strength_score)}>
                          Logic: {exp.logical_strength_score ?? "-"}
                        </span>
                        <span className={getScoreColor(exp.clarity_score)}>
                          Clarity: {exp.clarity_score ?? "-"}
                        </span>
                        {exp.is_public ? (
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
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/view/${exp.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => togglePublic(exp.id, exp.is_public)}
                      >
                        {exp.is_public ? (
                          <Lock className="h-4 w-4" />
                        ) : (
                          <Globe className="h-4 w-4" />
                        )}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this analysis?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(exp.id)}
                              disabled={deletingId === exp.id}
                            >
                              {deletingId === exp.id ? "Deleting..." : "Delete"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
