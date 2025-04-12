
import React, { useRef, useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface AudioRecorderProps {
  onAudioRecorded: (blob: Blob) => void;
  isProcessing: boolean;
  isPlaying: boolean;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ 
  onAudioRecorded, 
  isProcessing,
  isPlaying
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermissionGranted, setAudioPermissionGranted] = useState<boolean | null>(null);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Request microphone permission on component mount
  useEffect(() => {
    checkMicrophonePermission();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      setIsRequestingPermission(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setAudioPermissionGranted(true);
      
      if (!isRecording) {
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    } catch (error) {
      console.error('Microphone permission error:', error);
      setAudioPermissionGranted(false);
      toast.error('Microphone access denied. Please enable microphone access in your browser settings.');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const startRecording = async () => {
    try {
      // If permission not granted yet, request it first
      if (audioPermissionGranted === false) {
        await checkMicrophonePermission();
        if (audioPermissionGranted === false) {
          return; // Still no permission, exit
        }
      }
      
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(streamRef.current);
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        onAudioRecorded(audioBlob);
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Recording start error:', error);
      toast.error('Failed to start recording. Please check microphone access.');
      setAudioPermissionGranted(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleButtonClick = () => {
    if (audioPermissionGranted === false) {
      checkMicrophonePermission();
    } else {
      toggleRecording();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-bot-primary opacity-20 animate-pulse-ring"></div>
        )}
        {isPlaying && (
          <div className="absolute inset-0 rounded-full bg-bot-secondary opacity-20 animate-pulse-ring"></div>
        )}
        
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-20 w-20 rounded-full transition-all duration-200 shadow-md",
            isRecording ? "bg-red-500 text-white border-red-500" : 
            isProcessing ? "bg-yellow-100 border-yellow-500" :
            isPlaying ? "bg-bot-secondary border-bot-secondary text-white" :
            isRequestingPermission ? "bg-gray-200 border-gray-400" :
            audioPermissionGranted === false ? "bg-red-100 border-red-300 hover:bg-red-200 hover:text-red-800" :
            "bg-white border-bot-primary hover:bg-bot-primary hover:text-white"
          )}
          onClick={handleButtonClick}
          disabled={isProcessing || isPlaying || isRequestingPermission}
        >
          {isProcessing ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isPlaying ? (
            <Volume2 className="h-8 w-8" />
          ) : isRecording ? (
            <MicOff className="h-8 w-8" />
          ) : isRequestingPermission ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : audioPermissionGranted === false ? (
            <Mic className="h-8 w-8 text-red-500" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>
      
      <p className="mt-4 text-sm text-muted-foreground">
        {isRecording ? 'Listening...' : 
         isProcessing ? 'Processing...' :
         isPlaying ? 'Speaking...' :
         isRequestingPermission ? 'Requesting microphone access...' :
         audioPermissionGranted === false ? 'Microphone access denied. Click to retry.' :
         'Tap to speak'}
      </p>
    </div>
  );
};

export default AudioRecorder;
