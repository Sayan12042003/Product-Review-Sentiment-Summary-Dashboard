import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SummaryPanel = () => {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary');
      
      if (error) throw error;
      
      setSummary(data.summary);
      toast({
        title: "Summary Generated",
        description: "AI-powered insights are ready",
      });
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Failed to generate summary. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold">AI-Generated Summary</h3>
        </div>
        <Button 
          onClick={generateSummary} 
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate Summary
            </>
          )}
        </Button>
      </div>

      {summary ? (
        <div className="prose prose-sm max-w-none">
          <div className="bg-muted/50 rounded-lg p-6 whitespace-pre-wrap">
            {summary}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Click "Generate Summary" to get AI-powered insights</p>
          <p className="text-sm mt-1">
            Analyzes sentiment trends, pros, cons, and key themes
          </p>
        </div>
      )}
    </Card>
  );
};

export default SummaryPanel;
