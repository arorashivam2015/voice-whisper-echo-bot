
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { loadApiConfig, updateApiConfig } from '@/services/apiService';
import { toast } from '@/lib/toast';
import { supabase } from '@/integrations/supabase/client';

interface ApiConfigDialogProps {
  onConfigUpdated: () => void;
}

const ApiConfigDialog: React.FC<ApiConfigDialogProps> = ({ onConfigUpdated }) => {
  const [open, setOpen] = useState(false);
  const [googleSpeechApiKey, setGoogleSpeechApiKey] = useState('');
  const [databricksEndpoint, setDatabricksEndpoint] = useState('');
  const [databricksToken, setDatabricksToken] = useState('');
  const [textToSpeechApiKey, setTextToSpeechApiKey] = useState('');
  const [textToSpeechEndpoint, setTextToSpeechEndpoint] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status
    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user);
    });

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Load saved API configuration when the dialog opens
    if (open) {
      loadApiConfig().then(config => {
        setGoogleSpeechApiKey(config.googleSpeechApiKey);
        setDatabricksEndpoint(config.databricksEndpoint);
        setDatabricksToken(config.databricksToken);
        setTextToSpeechApiKey(config.textToSpeechApiKey);
        setTextToSpeechEndpoint(config.textToSpeechEndpoint);
      });
    }
  }, [open]);

  const handleSave = async () => {
    await updateApiConfig({
      googleSpeechApiKey,
      databricksEndpoint,
      databricksToken,
      textToSpeechApiKey,
      textToSpeechEndpoint
    });
    
    toast.success('API configuration saved successfully');
    setOpen(false);
    onConfigUpdated();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="absolute top-4 right-4 md:top-6 md:right-6">
          <Settings className="h-5 w-5" />
          <span className="sr-only">Settings</span>
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-yellow-800 text-sm">
                Note: You are not logged in. Your API keys will be stored in local storage. 
                For more secure storage, please sign in or create an account.
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="googleSpeechApiKey">Google Speech-to-Text API Key</Label>
            <Input
              id="googleSpeechApiKey"
              type="password"
              placeholder="Enter your Google Speech API key"
              value={googleSpeechApiKey}
              onChange={(e) => setGoogleSpeechApiKey(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="databricksEndpoint">Databricks API Endpoint</Label>
            <Input
              id="databricksEndpoint"
              placeholder="https://your-databricks-endpoint.com"
              value={databricksEndpoint}
              onChange={(e) => setDatabricksEndpoint(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="databricksToken">Databricks API Token</Label>
            <Input
              id="databricksToken"
              type="password"
              placeholder="Enter your Databricks API token"
              value={databricksToken}
              onChange={(e) => setDatabricksToken(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textToSpeechApiKey">Text-to-Speech API Key</Label>
            <Input
              id="textToSpeechApiKey"
              type="password"
              placeholder="Enter your Text-to-Speech API key"
              value={textToSpeechApiKey}
              onChange={(e) => setTextToSpeechApiKey(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="textToSpeechEndpoint">Text-to-Speech Endpoint</Label>
            <Input
              id="textToSpeechEndpoint"
              placeholder="https://your-tts-endpoint.com"
              value={textToSpeechEndpoint}
              onChange={(e) => setTextToSpeechEndpoint(e.target.value)}
            />
          </div>
          
          <Button onClick={handleSave} className="w-full mt-4 bg-gradient-bot">
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ApiConfigDialog;
