import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory rate limiting (resets on function restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW = 60000; // 1 minute in milliseconds

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting check
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    if (!checkRateLimit(clientIP)) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED'
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { image } = await req.json();

    // Input validation: Check file size (max 10MB base64)
    if (!image || typeof image !== 'string') {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid request. Image data is required.',
          code: 'INVALID_INPUT'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (image.length > 10 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ 
          error: 'Image too large. Maximum size is 10MB.',
          code: 'FILE_TOO_LARGE'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate base64 format and image type
    const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp|bmp);base64,/;
    if (!base64Regex.test(image)) {
      return new Response(
        JSON.stringify({ 
          error: 'Invalid image format. Please upload a valid image file.',
          code: 'INVALID_FORMAT'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Service configuration error. Please contact support.',
          code: 'CONFIG_ERROR'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }


    console.log('Starting ingredient analysis for IP:', clientIP);

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
      
      // Return generic error to client, log details server-side
      return new Response(
        JSON.stringify({ 
          error: 'Analysis service temporarily unavailable. Please try again.',
          code: 'SERVICE_ERROR'
        }),
        { 
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }


    const data = await response.json();
    console.log('AI response received successfully');

    const content = data.choices[0].message.content;
    
    // Safer JSON parsing with fallback
    let ingredients;
    try {
      // Try direct JSON parse first
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        ingredients = parsed;
      } else {
        throw new Error('Response is not an array');
      }
    } catch (directParseError) {
      // Fallback to regex extraction if direct parse fails
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          ingredients = JSON.parse(jsonMatch[0]);
          
          // Validate structure
          if (!Array.isArray(ingredients)) {
            throw new Error('Extracted content is not an array');
          }
        } else {
          throw new Error('No JSON array found in response');
        }
      } catch (regexParseError) {
        console.error('Failed to parse AI response:', content.substring(0, 200));
        return new Response(
          JSON.stringify({ 
            error: 'Unable to process analysis results. Please try again.',
            code: 'PARSE_ERROR'
          }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Validate ingredient structure
    const isValidIngredient = (ing: any) => 
      ing && 
      typeof ing === 'object' && 
      typeof ing.name === 'string' && 
      (ing.status === 'good' || ing.status === 'bad') &&
      typeof ing.explanation === 'string';

    if (!ingredients.every(isValidIngredient)) {
      console.error('Invalid ingredient structure in response');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid analysis format received. Please try again.',
          code: 'INVALID_RESPONSE'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Successfully analyzed ${ingredients.length} ingredients`);

    return new Response(
      JSON.stringify({ ingredients }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    // Log full error details server-side
    console.error('Error in analyze-ingredients:', error);
    
    // Return sanitized error to client
    return new Response(
      JSON.stringify({ 
        error: 'Unable to process your request. Please try again later.',
        code: 'PROCESSING_ERROR'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
