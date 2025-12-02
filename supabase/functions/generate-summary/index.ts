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

    // Fetch all reviews
    const { data: reviews, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })

    if (fetchError) {
      console.error('Error fetching reviews:', fetchError)
      throw fetchError
    }

    if (!reviews || reviews.length === 0) {
      return new Response(
        JSON.stringify({ summary: 'No reviews available to analyze.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare reviews text for AI
    const reviewsText = reviews.map(r => 
      `Product: ${r.product_name}\nRating: ${r.rating}/5\nReview: ${r.review_text}\nSentiment: ${r.sentiment || 'unknown'}`
    ).join('\n\n---\n\n')

    console.log(`Generating summary for ${reviews.length} reviews`)

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
            content: `You are a product review analyst. Analyze the provided reviews and create a comprehensive summary that includes:
1. Overall sentiment distribution
2. Top 3-5 positive themes (pros)
3. Top 3-5 negative themes (cons)
4. Key insights and recommendations

Format your response as a structured summary that's easy to read.`
          },
          {
            role: 'user',
            content: `Analyze these product reviews and provide insights:\n\n${reviewsText}`
          }
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('AI Gateway error:', response.status, errorText)
      throw new Error('Failed to generate summary')
    }

    const aiData = await response.json()
    const summary = aiData.choices[0].message.content

    return new Response(
      JSON.stringify({ summary }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in generate-summary function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})