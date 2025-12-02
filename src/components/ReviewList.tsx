import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  product_name: string;
  review_text: string;
  rating: number;
  sentiment: string | null;
  created_at: string;
}

const ReviewList = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setReviews(data);
    }
  };

  const getSentimentBadge = (sentiment: string | null) => {
    if (!sentiment) {
      return <Badge variant="outline">Unanalyzed</Badge>;
    }

    const variants: Record<string, { bg: string; text: string }> = {
      positive: { bg: "bg-sentiment-positive-light", text: "text-sentiment-positive" },
      neutral: { bg: "bg-sentiment-neutral-light", text: "text-sentiment-neutral" },
      negative: { bg: "bg-sentiment-negative-light", text: "text-sentiment-negative" },
    };

    const variant = variants[sentiment] || variants.neutral;

    return (
      <Badge className={`${variant.bg} ${variant.text} border-0`}>
        {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            No reviews yet. Upload some data to get started.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold">{review.product_name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-sentiment-neutral text-sentiment-neutral"
                            : "text-muted"
                        }`}
                      />
                    ))}
                  </div>
                </div>
                {getSentimentBadge(review.sentiment)}
              </div>
              <p className="text-sm text-muted-foreground">
                {review.review_text}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default ReviewList;
