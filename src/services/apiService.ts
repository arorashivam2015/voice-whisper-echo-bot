
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
export const updateApiConfig = (config: Partial<ApiConfig>) => {
  apiConfig = { ...apiConfig, ...config };
  // Save to localStorage
  localStorage.setItem('voice-bot-api-config', JSON.stringify(apiConfig));
};

// Load API configuration from localStorage
export const loadApiConfig = (): ApiConfig => {
  const savedConfig = localStorage.getItem('voice-bot-api-config');
  if (savedConfig) {
    apiConfig = { ...apiConfig, ...JSON.parse(savedConfig) };
  }
  return apiConfig;
};

// Convert speech to text using Google Speech API
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
    
    // Call Google Speech API
    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize?key=' + apiConfig.googleSpeechApiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config: {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
        },
        audio: {
          content: audioBase64,
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to convert speech to text');
    }
    
    return data.results?.[0]?.alternatives?.[0]?.transcript || '';
  } catch (error) {
    console.error('Speech to text error:', error);
    throw error;
  }
};

// Process text with Databricks API
export const processDatabricksApi = async (text: string): Promise<string> => {
  if (!apiConfig.databricksEndpoint) {
    throw new Error('Databricks endpoint not configured');
  }

  try {
    const response = await fetch(apiConfig.databricksEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to process with Databricks API');
    }
    
    return data.response || '';
  } catch (error) {
    console.error('Databricks API error:', error);
    throw error;
  }
};

// Convert text to speech
export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  if (!apiConfig.textToSpeechApiKey || !apiConfig.textToSpeechEndpoint) {
    throw new Error('Text to speech API not configured');
  }

  try {
    const response = await fetch(apiConfig.textToSpeechEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiConfig.textToSpeechApiKey}`,
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
    
    return await response.arrayBuffer();
  } catch (error) {
    console.error('Text to speech error:', error);
    throw error;
  }
};
