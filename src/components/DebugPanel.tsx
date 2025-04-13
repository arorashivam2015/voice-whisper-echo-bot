
import React from 'react';
import { debugInfo } from '@/services/apiService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        <ScrollArea className="h-[300px] rounded-md border">
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
            
            {/* Databricks Request */}
            {debugInfo.databricksRawRequestBody && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Databricks Request:</h3>
                <pre className="text-xs p-2 bg-white rounded border border-gray-200 overflow-x-auto">
                  {JSON.stringify(debugInfo.databricksRawRequestBody, null, 2)}
                </pre>
              </div>
            )}
            
            {/* Databricks Response */}
            {debugInfo.databricksResponse && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Databricks Response:</h3>
                <p className="text-sm p-2 bg-white rounded border border-gray-200">
                  {debugInfo.databricksResponse}
                </p>
              </div>
            )}
            
            {/* Databricks Raw Response Data */}
            {debugInfo.databricksRawResponseData && (
              <div>
                <h3 className="text-xs font-semibold text-gray-600 uppercase mb-1">Databricks Raw Response Data:</h3>
                <Tabs defaultValue="formatted">
                  <TabsList className="mb-2">
                    <TabsTrigger value="formatted">Formatted</TabsTrigger>
                    <TabsTrigger value="raw">Raw</TabsTrigger>
                  </TabsList>
                  <TabsContent value="formatted">
                    <pre className="text-xs p-2 bg-white rounded border border-gray-200 overflow-x-auto">
                      {JSON.stringify(debugInfo.databricksRawResponseData, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="raw">
                    <pre className="text-xs p-2 bg-white rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(debugInfo.databricksRawResponseData)}
                    </pre>
                  </TabsContent>
                </Tabs>
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
             !debugInfo.databricksRawResponseData &&
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
