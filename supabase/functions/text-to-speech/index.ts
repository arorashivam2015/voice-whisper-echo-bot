
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, textToSpeechEndpoint, textToSpeechApiKey } = await req.json();

    if (!text || !textToSpeechEndpoint || !textToSpeechApiKey) {
      throw new Error('Missing required parameters: text, textToSpeechEndpoint, and textToSpeechApiKey are required');
    }

    // Convert text to speech
    const response = await fetch(textToSpeechEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${textToSpeechApiKey}`,
      },
      body: JSON.stringify({
        text,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to convert text to speech');
    }
    
    // Return the audio data directly
    const audioBuffer = await response.arrayBuffer();
    return new Response(
      audioBuffer,
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="speech.mp3"'
        } 
      }
    );
  } catch (error) {
    console.error('Text to speech error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
