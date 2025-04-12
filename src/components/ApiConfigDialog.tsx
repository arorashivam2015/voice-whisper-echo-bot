import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import { loadApiConfig, updateApiConfig } from '@/services/apiService';
import { toast } from '@/lib/toast';

interface ApiConfigDialogProps {
  onConfigUpdated: () => void;
}

const ApiConfigDialog: React.FC<ApiConfigDialogProps> = ({ onConfigUpdated }) => {
  const [open, setOpen] = useState(false);
  const [googleSpeechApiKey, setGoogleSpeechApiKey] = useState('');
  const [databricksEndpoint, setDatabricksEndpoint] = useState('');
  const [textToSpeechApiKey, setTextToSpeechApiKey] = useState('');
  const [textToSpeechEndpoint, setTextToSpeechEndpoint] = useState('');

  useEffect(() => {
    // Load saved API configuration when the dialog opens
    if (open) {
      const config = loadApiConfig();
      setGoogleSpeechApiKey(config.googleSpeechApiKey);
      setDatabricksEndpoint(config.databricksEndpoint);
      setTextToSpeechApiKey(config.textToSpeechApiKey);
      setTextToSpeechEndpoint(config.textToSpeechEndpoint);
    }
  }, [open]);

  const handleSave = () => {
    updateApiConfig({
      googleSpeechApiKey,
      databricksEndpoint,
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
