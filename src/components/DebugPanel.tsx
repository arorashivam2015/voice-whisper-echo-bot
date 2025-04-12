
import React from 'react';
import { debugInfo } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DebugPanelProps {
  isVisible: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <Card className="w-full my-4 bg-slate-50 border-2 border-dashed border-gray-300">
      <CardHeader className="p-3 bg-slate-100">
        <CardTitle className="text-sm font-medium text-gray-700">Debugging Information</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <ScrollArea className="h-[200px] rounded-md border">
          <div className="p-3 space-y-4">
            {/* Speech to Text */}
            {debugInfo.speechToTextResult && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Speech to Text Result:</h3>
                <p className="text-sm p-2 bg-white rounded border border-gray-200">
                  {debugInfo.speechToTextResult}
                </p>
              </div>
            )}
            
            {/* Databricks Input */}
            {debugInfo.databricksInput && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Databricks Input:</h3>
                <p className="text-sm p-2 bg-white rounded border border-gray-200">
                  {debugInfo.databricksInput}
                </p>
              </div>
            )}
            
            {/* Databricks Response */}
            {debugInfo.databricksResponse && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Databricks Raw Response:</h3>
                <pre className="text-xs p-2 bg-white rounded border border-gray-200 overflow-x-auto">
                  {JSON.stringify(debugInfo.databricksResponse, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Text to Speech Input */}
            {debugInfo.textToSpeechInput && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Text to Speech Input:</h3>
                <p className="text-sm p-2 bg-white rounded border border-gray-200">
                  {debugInfo.textToSpeechInput}
                </p>
              </div>
            )}
            
            {/* If no debug info available */}
            {!debugInfo.speechToTextResult && 
             !debugInfo.databricksInput && 
             !debugInfo.databricksResponse && 
             !debugInfo.textToSpeechInput && (
              <p className="text-sm text-gray-500 italic">No debug information available yet. Start a conversation to see data.</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
