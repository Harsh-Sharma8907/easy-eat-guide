import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Starting ingredient analysis...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-pro',
        messages: [
          {
            role: 'system',
            content: `You are a nutrition expert analyzing food ingredient lists. Your job is to:
1. Extract all ingredients from the image
2. Classify each ingredient as either "good" (healthy, natural, beneficial) or "bad" (unhealthy, processed, should be limited)
3. Provide a short, clear explanation for each classification in everyday language

Return your response as a JSON array of objects with this structure:
[
  {
    "name": "ingredient name",
    "status": "good" or "bad",
    "explanation": "brief explanation in simple terms"
  }
]

Focus on being accurate, helpful, and using language that anyone can understand. Avoid technical jargon.`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze the ingredients in this image and classify each one as good or bad for health.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const content = data.choices[0].message.content;
    
    // Extract JSON from the response (it might be wrapped in markdown code blocks)
    let ingredients;
    try {
      // Try to find JSON in the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        ingredients = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON array found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('Failed to parse ingredient analysis');
    }

    console.log(`Successfully analyzed ${ingredients.length} ingredients`);

    return new Response(
      JSON.stringify({ ingredients }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-ingredients:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to analyze ingredients'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
