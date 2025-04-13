
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
    const { text, databricksEndpoint, databricksToken } = await req.json();

    if (!text || !databricksEndpoint) {
      throw new Error('Missing required parameters: text and databricksEndpoint are required');
    }
    
    if (!databricksToken) {
      throw new Error('Missing required parameter: databricksToken is required');
    }

    console.log(`Processing text with Databricks: "${text}"`);
    
    // Process with Databricks API
    const response = await fetch(databricksEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${databricksToken}`
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    console.log('Databricks API response:', data);
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to process with Databricks API');
    }
    
    return new Response(
      JSON.stringify({
        inputText: text,
        response: data.response || '',
        rawDatabricksResponse: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Databricks API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
