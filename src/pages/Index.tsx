import { useState } from "react";
import { Upload, TrendingUp, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import FileUpload from "@/components/FileUpload";
import SentimentChart from "@/components/SentimentChart";
import ReviewList from "@/components/ReviewList";
import SummaryPanel from "@/components/SummaryPanel";
import StatsOverview from "@/components/StatsOverview";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-reviews');
      
      if (error) throw error;
      
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.analyzed} reviews`,
      });
      
      setRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error analyzing reviews:', error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Failed to analyze reviews. Please try again.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Review Sentiment Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                AI-powered product review analysis and insights
              </p>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              size="lg"
              className="gap-2"
            >
              <TrendingUp className="h-5 w-5" />
              {isAnalyzing ? "Analyzing..." : "Analyze Reviews"}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Upload Section */}
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <Upload className="h-6 w-6 text-primary" />
              <h2 className="text-xl font-semibold">Upload Reviews</h2>
            </div>
            <FileUpload onUploadComplete={() => setRefreshKey(prev => prev + 1)} />
          </Card>

          {/* Stats Overview */}
          <StatsOverview key={`stats-${refreshKey}`} />

          {/* Dashboard Tabs */}
          <Tabs defaultValue="charts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto">
              <TabsTrigger value="charts" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Charts
              </TabsTrigger>
              <TabsTrigger value="summary" className="gap-2">
                <FileText className="h-4 w-4" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="reviews" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Reviews
              </TabsTrigger>
            </TabsList>

            <TabsContent value="charts" className="space-y-6">
              <SentimentChart key={`chart-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="summary" className="space-y-6">
              <SummaryPanel key={`summary-${refreshKey}`} />
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <ReviewList key={`reviews-${refreshKey}`} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Index;
