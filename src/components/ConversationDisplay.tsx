
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
}

interface ConversationDisplayProps {
  messages: Message[];
  className?: string;
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ messages, className }) => {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return null;
  }

  return (
    <Card className={cn("border border-bot-accent bg-bot-background/50 backdrop-blur-sm", className)}>
      <CardContent className="p-4 max-h-[300px] overflow-y-auto">
        {messages.map((message, index) => (
          <React.Fragment key={message.id}>
            {index > 0 && <Separator className="my-3" />}
            <div className={cn(
              "flex flex-col",
              message.isUser ? "items-end" : "items-start"
            )}>
              <span className="text-xs text-muted-foreground">
                {message.isUser ? 'You' : 'Bot'}
              </span>
              <div className={cn(
                "mt-1 p-3 rounded-lg max-w-[85%]",
                message.isUser 
                  ? "bg-bot-primary text-white rounded-tr-none" 
                  : "bg-white rounded-tl-none"
              )}>
                {message.text}
              </div>
            </div>
          </React.Fragment>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;
