import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const SentimentChart = () => {
  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('sentiment, created_at')
      .order('created_at', { ascending: true });

    if (reviews) {
      // Pie chart data
      const sentimentCounts = {
        positive: reviews.filter(r => r.sentiment === 'positive').length,
        neutral: reviews.filter(r => r.sentiment === 'neutral').length,
        negative: reviews.filter(r => r.sentiment === 'negative').length,
      };

      setPieData([
        { name: 'Positive', value: sentimentCounts.positive, color: 'hsl(var(--chart-1))' },
        { name: 'Neutral', value: sentimentCounts.neutral, color: 'hsl(var(--chart-2))' },
        { name: 'Negative', value: sentimentCounts.negative, color: 'hsl(var(--chart-3))' },
      ]);

      // Bar chart data - reviews over time
      const dateMap = new Map<string, any>();
      reviews.forEach(review => {
        const date = new Date(review.created_at).toLocaleDateString();
        if (!dateMap.has(date)) {
          dateMap.set(date, { date, positive: 0, neutral: 0, negative: 0 });
        }
        const entry = dateMap.get(date);
        if (review.sentiment) {
          entry[review.sentiment]++;
        }
      });

      setBarData(Array.from(dateMap.values()));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Pie Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </Card>

      {/* Bar Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Sentiment Trends Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="positive" fill="hsl(var(--chart-1))" name="Positive" />
            <Bar dataKey="neutral" fill="hsl(var(--chart-2))" name="Neutral" />
            <Bar dataKey="negative" fill="hsl(var(--chart-3))" name="Negative" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default SentimentChart;
