
import { supabase } from '@/integrations/supabase/client';

interface ApiConfig {
  googleSpeechApiKey: string;
  databricksEndpoint: string;
  textToSpeechApiKey: string;
  textToSpeechEndpoint: string;
}

// Store API configuration
let apiConfig: ApiConfig = {
  googleSpeechApiKey: '',
  databricksEndpoint: '',
  textToSpeechApiKey: '',
  textToSpeechEndpoint: ''
};

// Update API configuration
export const updateApiConfig = async (config: Partial<ApiConfig>) => {
  apiConfig = { ...apiConfig, ...config };
  
  // Save to localStorage as a fallback
  localStorage.setItem('voice-bot-api-config', JSON.stringify(apiConfig));
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Try to update existing record first
      const { data, error } = await supabase
        .from('api_configurations')
        .update({
          google_speech_api_key: apiConfig.googleSpeechApiKey,
          databricks_endpoint: apiConfig.databricksEndpoint,
          text_to_speech_api_key: apiConfig.textToSpeechApiKey,
          text_to_speech_endpoint: apiConfig.textToSpeechEndpoint,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
      
      // If no record exists (error or no data), insert a new one
      if (error || !data) {
        await supabase
          .from('api_configurations')
          .insert([{
            user_id: user.id,
            google_speech_api_key: apiConfig.googleSpeechApiKey,
            databricks_endpoint: apiConfig.databricksEndpoint,
            text_to_speech_api_key: apiConfig.textToSpeechApiKey,
            text_to_speech_endpoint: apiConfig.textToSpeechEndpoint
          }]);
      }
    }
  } catch (error) {
    console.error('Error saving API config to Supabase:', error);
    // Fallback to localStorage already done above
  }
};

// Load API configuration from Supabase or localStorage
export const loadApiConfig = async (): Promise<ApiConfig> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Try to get config from Supabase
      const { data, error } = await supabase
        .from('api_configurations')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        apiConfig = {
          googleSpeechApiKey: data.google_speech_api_key || '',
          databricksEndpoint: data.databricks_endpoint || '',
          textToSpeechApiKey: data.text_to_speech_api_key || '',
          textToSpeechEndpoint: data.text_to_speech_endpoint || ''
        };
        
        // Update localStorage as well
        localStorage.setItem('voice-bot-api-config', JSON.stringify(apiConfig));
        return apiConfig;
      }
    }
  } catch (error) {
    console.error('Error loading API config from Supabase:', error);
  }
  
  // Fallback to localStorage
  const savedConfig = localStorage.getItem('voice-bot-api-config');
  if (savedConfig) {
    apiConfig = { ...apiConfig, ...JSON.parse(savedConfig) };
  }
  
  return apiConfig;
};

// Debug information
interface DebugInfo {
  speechToTextResult?: string;
  databricksInput?: string;
  databricksResponse?: any;
  textToSpeechInput?: string;
}

export let debugInfo: DebugInfo = {};

// Reset debug info
export const resetDebugInfo = () => {
  debugInfo = {};
};

// Convert speech to text using Supabase edge function
export const speechToText = async (audioBlob: Blob): Promise<string> => {
  if (!apiConfig.googleSpeechApiKey) {
    throw new Error('Google Speech API key not configured');
  }

  try {
    // Convert audio blob to base64
    const reader = new FileReader();
    const audioBase64Promise = new Promise<string>((resolve) => {
      reader.onloadend = () => {
        const base64Audio = reader.result?.toString().split(',')[1] || '';
        resolve(base64Audio);
      };
      reader.readAsDataURL(audioBlob);
    });
    
    const audioBase64 = await audioBase64Promise;
    
    // Call speech-to-text edge function
    const { data, error } = await supabase.functions.invoke('speech-to-text', {
      body: {
        audioBase64,
        googleSpeechApiKey: apiConfig.googleSpeechApiKey
      }
    });
    
    if (error) throw new Error(error.message);
    
    const transcript = data?.transcript || '';
    
    // Store debug info
    debugInfo.speechToTextResult = transcript;
    
    return transcript;
  } catch (error) {
    console.error('Speech to text error:', error);
    throw error;
  }
};

// Process text with Databricks API through edge function
export const processDatabricksApi = async (text: string): Promise<string> => {
  if (!apiConfig.databricksEndpoint) {
    throw new Error('Databricks endpoint not configured');
  }

  try {
    // Store debug info
    debugInfo.databricksInput = text;
    
    // Call process-databricks edge function
    const { data, error } = await supabase.functions.invoke('process-databricks', {
      body: {
        text,
        databricksEndpoint: apiConfig.databricksEndpoint
      }
    });
    
    if (error) throw new Error(error.message);
    
    // Store debug info
    debugInfo.databricksResponse = data?.rawDatabricksResponse;
    
    // Store conversation in Supabase if user is logged in
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && data?.response) {
        await supabase
          .from('conversations')
          .insert([{
            user_id: user.id,
            user_message: text,
            bot_response: data.response
          }]);
      }
    } catch (e) {
      console.error('Error storing conversation:', e);
      // Continue even if storing conversation fails
    }
    
    return data?.response || '';
  } catch (error) {
    console.error('Databricks API error:', error);
    throw error;
  }
};

// Convert text to speech using edge function
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  if (!apiConfig.textToSpeechApiKey || !apiConfig.textToSpeechEndpoint) {
    throw new Error('Text to speech API not configured');
  }

  try {
    // Store debug info
    debugInfo.textToSpeechInput = text;
    
    // Call text-to-speech edge function - FIX: Remove responseType option
    const { data, error } = await supabase.functions.invoke('text-to-speech', {
      body: {
        text,
        textToSpeechEndpoint: apiConfig.textToSpeechEndpoint,
        textToSpeechApiKey: apiConfig.textToSpeechApiKey
      }
    });
    
    if (error) throw new Error(error.message);
    
    // Convert Base64 to ArrayBuffer if needed
    if (typeof data === 'string') {
      const binaryString = atob(data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes.buffer;
    }
    
    // FIX: Changed 'response.data' to 'data'
    return data as ArrayBuffer;
  } catch (error) {
    console.error('Text to speech error:', error);
    throw error;
  }
};
