import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { TrendingUp, MessageSquare, ThumbsUp, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const StatsOverview = () => {
  const [stats, setStats] = useState({
    total: 0,
    positive: 0,
    neutral: 0,
    negative: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('sentiment');

    if (reviews) {
      setStats({
        total: reviews.length,
        positive: reviews.filter(r => r.sentiment === 'positive').length,
        neutral: reviews.filter(r => r.sentiment === 'neutral').length,
        negative: reviews.filter(r => r.sentiment === 'negative').length,
      });
    }
  };

  const statCards = [
    {
      title: "Total Reviews",
      value: stats.total,
      icon: MessageSquare,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Positive",
      value: stats.positive,
      icon: ThumbsUp,
      color: "text-sentiment-positive",
      bg: "bg-sentiment-positive-light",
    },
    {
      title: "Neutral",
      value: stats.neutral,
      icon: TrendingUp,
      color: "text-sentiment-neutral",
      bg: "bg-sentiment-neutral-light",
    },
    {
      title: "Negative",
      value: stats.negative,
      icon: AlertCircle,
      color: "text-sentiment-negative",
      bg: "bg-sentiment-negative-light",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </p>
                <h3 className="text-3xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-full ${stat.bg}`}>
                <Icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default StatsOverview;
