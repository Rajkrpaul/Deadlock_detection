'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DeadlockContext } from '@/lib/groq';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const CHAT_MESSAGES_STORAGE_KEY = 'deadlock-chat-messages';
const CHAT_CONTEXT_KEY_STORAGE_KEY = 'deadlock-chat-context-key';

function buildContextKey(context: DeadlockContext) {
  return JSON.stringify({
    deadlockedProcesses: context.deadlockedProcesses,
    cycles: context.cycles,
    allocations: context.allocations,
    requests: context.requests,
  });
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextKey, setContextKey] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem(CHAT_MESSAGES_STORAGE_KEY);
      const storedContextKey = localStorage.getItem(CHAT_CONTEXT_KEY_STORAGE_KEY);

      if (storedMessages) {
        const parsed = JSON.parse(storedMessages);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
        }
      }

      if (storedContextKey) {
        setContextKey(storedContextKey);
      }
    } catch (storageError) {
      console.error('Failed to load stored chat memory:', storageError);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CHAT_MESSAGES_STORAGE_KEY, JSON.stringify(messages));
    } catch (storageError) {
      console.error('Failed to persist chat messages:', storageError);
    }
  }, [messages]);

  useEffect(() => {
    try {
      if (contextKey) {
        localStorage.setItem(CHAT_CONTEXT_KEY_STORAGE_KEY, contextKey);
      } else {
        localStorage.removeItem(CHAT_CONTEXT_KEY_STORAGE_KEY);
      }
    } catch (storageError) {
      console.error('Failed to persist chat context:', storageError);
    }
  }, [contextKey]);

  const initializeChat = useCallback((initialContext: DeadlockContext) => {
    const nextContextKey = buildContextKey(initialContext);
    setContextKey(nextContextKey);

    // Keep memory when user reopens the same scenario.
    if (messages.length > 0 && contextKey === nextContextKey) {
      return;
    }

    setMessages([
      {
        role: 'assistant',
        content: `I've analyzed your deadlock scenario. I found ${initialContext.cycles.length} deadlock cycle(s) involving processes: ${initialContext.deadlockedProcesses.join(', ')}. What would you like to know about this deadlock or how to resolve it?`,
      },
    ]);
  }, [messages.length, contextKey]);

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
          const errorBody = await response.json().catch(() => null);
          const apiError =
            errorBody &&
            typeof errorBody.error === 'string' &&
            typeof errorBody.details === 'string'
              ? `${errorBody.error}: ${errorBody.details}`
              : errorBody && typeof errorBody.error === 'string'
              ? errorBody.error
              : response.statusText || `HTTP ${response.status}`;
          throw new Error(`Failed to get response: ${apiError}`);
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
    setContextKey(null);
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
