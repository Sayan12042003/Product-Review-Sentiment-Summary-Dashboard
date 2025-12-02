import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables')
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Fetch unanalyzed reviews
    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('analyzed', false)

    if (fetchError) {
      console.error('Error fetching reviews:', fetchError)
      throw fetchError
    }

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No reviews to analyze', analyzed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Analyzing ${reviews.length} reviews`)

    // Analyze each review
    for (const review of reviews) {
      try {
        const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: 'You are a sentiment analysis expert. Classify the sentiment of product reviews as positive, neutral, or negative. Respond with ONLY one word: positive, neutral, or negative.'
              },
              {
                role: 'user',
                content: `Review: "${review.review_text}"\n\nSentiment:`
              }
            ],
            temperature: 0.1,
          }),
        })

        if (!response.ok) {
          console.error(`AI Gateway error for review ${review.id}:`, response.status)
          continue
        }

        const aiData = await response.json()
        const sentiment = aiData.choices[0].message.content.trim().toLowerCase()

        // Validate sentiment
        const validSentiment = ['positive', 'neutral', 'negative'].includes(sentiment) 
          ? sentiment 
          : 'neutral'

        // Update review with sentiment
        const { error: updateError } = await supabase
          .from('reviews')
          .update({ sentiment: validSentiment, analyzed: true })
          .eq('id', review.id)

        if (updateError) {
          console.error(`Error updating review ${review.id}:`, updateError)
        }
      } catch (error) {
        console.error(`Error analyzing review ${review.id}:`, error)
      }
    }

    return new Response(
      JSON.stringify({ message: 'Analysis complete', analyzed: reviews.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in analyze-reviews function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})