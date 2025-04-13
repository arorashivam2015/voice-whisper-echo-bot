
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
    console.log(`Using Databricks endpoint: ${databricksEndpoint}`);
    console.log('Databricks token is present:', !!databricksToken);
    
    // Process with Databricks API
    try {
      // Create request body based on Databricks API requirements
      // Using all three possible formats to ensure compatibility
      const requestBody = {
        messages: [{ role: "user", content: text }],
        "max_tokens": 100
      };
      
      console.log('Sending formatted request to Databricks:', JSON.stringify(requestBody));
      
      const response = await fetch(databricksEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${databricksToken}`
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Databricks API status code:', response.status);
      
      const data = await response.json();
      console.log('Databricks API raw response:', JSON.stringify(data));
      
      if (!response.ok) {
        throw new Error(data.error?.message || `Failed to process with Databricks API: ${response.status} ${response.statusText}`);
      }
      
      // Extract response based on various possible response formats
      const extractedResponse = 
        data.response || 
        data.result || 
        data.output || 
        data.answer || 
        data.message || 
        (data.choices && data.choices[0]?.message?.content) ||
        (data.choices && data.choices[0]?.text) ||
        '';
      
      return new Response(
        JSON.stringify({
          inputText: text,
          response: extractedResponse,
          rawDatabricksResponse: data
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      console.error('Fetch error with Databricks API:', fetchError);
      throw new Error(`Error fetching from Databricks API: ${fetchError.message}`);
    }
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
