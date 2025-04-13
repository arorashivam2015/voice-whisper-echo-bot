
import React, { useState, useEffect, useRef } from 'react';
import { toast } from '@/lib/toast';
import AudioRecorder from '@/components/AudioRecorder';
import ApiConfigDialog from '@/components/ApiConfigDialog';
import AuthDialog from '@/components/AuthDialog';
import ConversationDisplay from '@/components/ConversationDisplay';
import DebugPanel from '@/components/DebugPanel';
import { 
  speechToText, 
  processDatabricksApi, 
  textToSpeech, 
  loadApiConfig,
  resetDebugInfo
} from '@/services/apiService';
import { VolumeX, BugIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Check authentication status and load API config
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
      
      if (user) {
        // Load conversation history
        loadConversationHistory();
      }
    };
    
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isUserAuthenticated = !!session?.user;
      setIsAuthenticated(isUserAuthenticated);
      
      if (isUserAuthenticated) {
        loadConversationHistory();
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Load conversation history from Supabase
  const loadConversationHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (data && !error) {
        const formattedHistory = data.flatMap((conv) => [
          {
            id: `user-${conv.id}`,
            text: conv.user_message,
            isUser: true
          },
          {
            id: `bot-${conv.id}`,
            text: conv.bot_response,
            isUser: false
          }
        ]);
        
        setConversationHistory(formattedHistory);
        
        // Only update messages if none exist yet
        if (messages.length === 0) {
          setMessages(formattedHistory);
        }
      }
    } catch (error) {
      console.error('Error loading conversation history:', error);
    }
  };
  
  // Check if APIs are configured
  useEffect(() => {
    const checkConfig = async () => {
      const config = await loadApiConfig();
      const hasConfig = !!(
        config.googleSpeechApiKey && 
        config.databricksEndpoint && 
        config.textToSpeechApiKey &&
        config.textToSpeechEndpoint
      );
      
      setIsConfigured(hasConfig);
      
      if (!hasConfig) {
        toast.info('Please configure the API settings to begin');
      }
    };
    
    checkConfig();
  }, []);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    audioRef.current.onended = () => {
      setIsPlaying(false);
    };
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleAudioRecorded = async (audioBlob: Blob) => {
    if (!isConfigured) {
      toast.error('Please configure the API settings first');
      return;
    }
    
    setIsProcessing(true);
    resetDebugInfo(); // Reset debug info at the start of new recording
    
    try {
      // Convert speech to text
      const transcribedText = await speechToText(audioBlob);
      
      if (!transcribedText) {
        toast.error('Could not transcribe audio. Please try again.');
        setIsProcessing(false);
        return;
      }
      
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        text: transcribedText,
        isUser: true
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Process with Databricks API - the text-to-speech will be triggered inside this function
      const botResponse = await processDatabricksApi(transcribedText);
      
      // Add bot message
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        isUser: false
      };
      
      setMessages(prev => [...prev, botMessage]);
      
      // Convert response to speech and play it
      const audioData = await textToSpeech(botResponse);
      
      // Play the response
      if (audioRef.current) {
        const audioBlob = new Blob([audioData], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current.src = audioUrl;
        audioRef.current.onloadeddata = () => {
          setIsPlaying(true);
          audioRef.current?.play();
        };
      }
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfigUpdated = async () => {
    const config = await loadApiConfig();
    const hasConfig = !!(
      config.googleSpeechApiKey && 
      config.databricksEndpoint && 
      config.textToSpeechApiKey &&
      config.textToSpeechEndpoint
    );
    
    setIsConfigured(hasConfig);
  };

  const handleAuthChange = () => {
    // Reload API config after authentication changes
    handleConfigUpdated();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-white to-bot-background flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-bot-accent/20 blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-bot-secondary/20 blur-3xl"></div>
      
      <div className="w-full max-w-md flex flex-col items-center gap-8 z-10">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Voice Assistant</h1>
        
        {/* Debug toggle */}
        <div className="flex items-center space-x-2 self-end">
          <Switch
            id="debug-mode"
            checked={showDebugPanel}
            onCheckedChange={setShowDebugPanel}
          />
          <Label htmlFor="debug-mode" className="flex items-center gap-1 cursor-pointer">
            <BugIcon className="h-4 w-4" />
            <span>Debug Mode</span>
          </Label>
        </div>
        
        {/* Authentication status */}
        {isAuthenticated && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
            <p className="text-green-800 text-sm">
              Logged in - Your API keys and conversations are securely stored
            </p>
          </div>
        )}
        
        {/* Conversation history */}
        {messages.length > 0 && (
          <ConversationDisplay 
            messages={messages} 
            className="w-full mb-6"
          />
        )}
        
        {/* Debug panel */}
        <DebugPanel isVisible={showDebugPanel} />
        
        {/* Main voice interface */}
        <div className="w-full">
          <AudioRecorder 
            onAudioRecorded={handleAudioRecorded}
            isProcessing={isProcessing}
            isPlaying={isPlaying}
          />
        </div>
        
        {/* Configuration notice if not configured */}
        {!isConfigured && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <p className="text-yellow-800 text-sm">
              Please configure the API settings using the gear icon in the top right.
            </p>
          </div>
        )}
      </div>
      
      {/* Auth dialog */}
      <AuthDialog 
        isAuthenticated={isAuthenticated}
        onAuthChange={handleAuthChange}
      />
      
      {/* Settings dialog */}
      <ApiConfigDialog onConfigUpdated={handleConfigUpdated} />
      
      {/* Stop audio button - Only show when audio is playing */}
      {isPlaying && (
        <button
          className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.pause();
              setIsPlaying(false);
            }
          }}
        >
          <VolumeX className="h-4 w-4" />
          Stop audio
        </button>
      )}
      
      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-gray-500">
        <p>Configure API settings using the gear icon in the top right</p>
      </div>
    </div>
  );
};

export default Index;
