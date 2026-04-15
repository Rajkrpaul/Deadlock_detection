'use client';

import { useState, useCallback } from 'react';
import type { DeadlockContext } from '@/lib/groq';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeChat = useCallback((initialContext: DeadlockContext) => {
    setMessages([
      {
        role: 'assistant',
        content: `I've analyzed your deadlock scenario. I found ${initialContext.cycles.length} deadlock cycle(s) involving processes: ${initialContext.deadlockedProcesses.join(', ')}. What would you like to know about this deadlock or how to resolve it?`,
      },
    ]);
  }, []);

  const sendMessage = useCallback(
    async (userMessage: string, deadlockContext?: DeadlockContext) => {
      setError(null);
      setLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage,
            conversationHistory: messages,
            deadlockContext: deadlockContext || null,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to get response: ${response.statusText}`);
        }

        const data = await response.json();

        setMessages((prev) => [
          ...prev,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: data.response },
        ]);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Chat error:', err);
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const resetChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    sendMessage,
    initializeChat,
    resetChat,
  };
}
