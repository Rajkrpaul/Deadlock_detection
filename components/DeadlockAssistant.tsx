'use client';

import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import type { ChatMessage } from '@/hooks/useChat';
import type { DeadlockContext } from '@/lib/groq';

interface DeadlockAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  deadlockContext?: DeadlockContext;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  loading: boolean;
  error?: string | null;
}

export function DeadlockAssistant({
  isOpen,
  onClose,
  deadlockContext,
  messages,
  onSendMessage,
  loading,
  error,
}: DeadlockAssistantProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const message = input.trim();
    setInput('');
    await onSendMessage(message);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50">
      <div className="w-full max-w-2xl h-full max-h-[600px] bg-background rounded-t-lg shadow-lg flex flex-col">
        {/* Header */}
        <div className="border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg">Deadlock Assistant</h2>
            <p className="text-sm text-muted-foreground">
              Powered by Groq AI
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            ✕
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {deadlockContext && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 mb-2">
                Deadlock Detected
              </p>
              <p className="text-sm text-red-800">
                Found {deadlockContext.cycles.length} cycle(s) involving:{' '}
                <span className="font-mono font-semibold">
                  {deadlockContext.deadlockedProcesses.join(', ')}
                </span>
              </p>
            </div>
          )}

          {messages.length === 0 && !deadlockContext && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Ask me anything about deadlock detection and resolution.</p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground px-4 py-2 rounded-lg">
                <Spinner className="h-4 w-4" />
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={handleSend}
          className="border-t border-border px-6 py-4 space-y-4"
        >
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Ask about the deadlock or its resolution..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="sm"
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
