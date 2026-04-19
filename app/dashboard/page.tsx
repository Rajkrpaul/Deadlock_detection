'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { DataInputForm } from '@/components/DataInputForm';
import { DeadlockResults } from '@/components/DeadlockResults';
import { DeadlockAssistant } from '@/components/DeadlockAssistant';
import { LogOut, MessageSquare } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import type {
  Process,
  Resource,
  Allocation,
  Request as DeadlockRequest,
  DeadlockAnalysis,
  ResolutionStrategy,
} from '@/lib/algorithms';

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();

  const {
    messages,
    loading: chatLoading,
    error: chatError,
    sendMessage,
    initializeChat,
  } = useChat();

  const [analysis, setAnalysis] = useState<DeadlockAnalysis | null>(null);
  const [resolutions, setResolutions] = useState<ResolutionStrategy[]>([]);
  const [loading, setLoading] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);

  const [deadlockContext, setDeadlockContext] = useState<{
    deadlockedProcesses: string[];
    cycles: string[][];
    processes: Process[];
    resources: Resource[];
    allocations: Allocation[];
    requests: DeadlockRequest[];
  } | undefined>(undefined);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  const handleAnalyze = async (
    processes: Process[],
    resources: Resource[],
    allocations: Allocation[],
    requests: DeadlockRequest[]
  ) => {
    setLoading(true);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ processes, resources, allocations, requests }),
      });

      const data = await response.json();

      // 🛡️ SAFETY CHECK
      if (!data || !data.analysis) {
        console.error('API failed:', data);
        alert('Analysis failed. Check console.');
        return;
      }

      setAnalysis(data.analysis);
      setResolutions(data.resolutions);

      // Deadlock detected -> refresh assistant context.
      if (data.analysis.hasDeadlock) {
        const context = {
          deadlockedProcesses: data.analysis.deadlockedProcesses,
          cycles: data.analysis.cycles,
          processes,
          resources,
          allocations,
          requests,
        };

        setDeadlockContext(context);
        initializeChat(context);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Deadlock Detector
            </h1>
            <p className="text-sm text-muted-foreground">
              Analyze system state, visualize cycles, and resolve deadlocks faster.
            </p>
          </div>

          {/* 🔥 UPDATED HEADER */}
          <div className="flex items-center gap-4">
            <ThemeToggle />

            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssistantOpen(true)}
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>

            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(520px,1.1fr)_minmax(0,1.4fr)] gap-8">
          {/* Input */}
          <div>
            <Card className="p-6 sticky top-24 border border-border/80 shadow-sm rounded-xl bg-card/85 backdrop-blur">
              <h2 className="text-lg font-medium mb-6">
                System Configuration
              </h2>
              <DataInputForm onAnalyze={handleAnalyze} loading={loading} />
            </Card>
          </div>

          {/* Results */}
          <div>
            {analysis ? (
              <DeadlockResults
                analysis={analysis}
                resolutions={resolutions}
              />
            ) : (
              <Card className="p-12 text-center border border-border shadow-sm rounded-xl">
                <p className="text-muted-foreground mb-4">
                  Configure your system and run a deadlock analysis.
                </p>
                <p className="text-sm text-muted-foreground">
                  Add processes, resources, allocations, and requests to get insights.
                </p>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Assistant */}
      <DeadlockAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        deadlockContext={deadlockContext}
        messages={messages}
        onSendMessage={async (msg) =>
          await sendMessage(msg, deadlockContext)
        }
        loading={chatLoading}
        error={chatError}
      />
    </div>
  );
}