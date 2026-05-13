'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { DataInputForm } from '@/components/DataInputForm';
import { DeadlockAssistant } from '@/components/DeadlockAssistant';
import { DeadlockGraph } from '@/components/DeadlockGraph';
import {
  LogOut,
  MessageSquare,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ChevronDown,
  Play,
  Square,
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Wrench,
  Zap,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

import type {
  Process,
  Resource,
  Allocation,
  Request as DeadlockRequest,
  DeadlockAnalysis,
  ResolutionStrategy,
} from '@/lib/algorithms';

/* ─── Preset scenarios ──────────────────────────────────── */
const SCENARIOS = {
  // ── Deadlock scenarios ──────────────────────────────────
  'Classic Deadlock': {
    description: '2 processes, 2 resources — textbook circular wait',
    tag: 'deadlock' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 1, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 1 },
      { id: 'R2', name: 'R2', instances: 1 },
    ],
    allocations: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
    ],
    requests: [
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
      { processId: 'P2', resourceId: 'R1', quantity: 1 },
    ],
  },
  'Chain Deadlock': {
    description: '3 processes in a circular chain — P1→P2→P3→P1',
    tag: 'deadlock' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 1, status: 'running' as const },
      { id: 'P3', name: 'P3', priority: 1, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 1 },
      { id: 'R2', name: 'R2', instances: 1 },
      { id: 'R3', name: 'R3', instances: 1 },
    ],
    allocations: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
      { processId: 'P3', resourceId: 'R3', quantity: 1 },
    ],
    requests: [
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
      { processId: 'P2', resourceId: 'R3', quantity: 1 },
      { processId: 'P3', resourceId: 'R1', quantity: 1 },
    ],
  },
  'Star Deadlock': {
    description: 'Multiple processes all blocked waiting on a single central shared resource (R1)',
    tag: 'deadlock' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 1, status: 'running' as const },
      { id: 'P3', name: 'P3', priority: 1, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 1 },
      { id: 'R2', name: 'R2', instances: 1 },
      { id: 'R3', name: 'R3', instances: 1 },
    ],
    allocations: [
      // P1 holds R1 (the central hub resource)
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      // P2 holds R2, P3 holds R3 (spokes)
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
      { processId: 'P3', resourceId: 'R3', quantity: 1 },
    ],
    requests: [
      // P1 (holds R1) wants R2 → blocked by P2
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
      // P2 (holds R2) wants R1 → blocked by P1 — deadlock core
      { processId: 'P2', resourceId: 'R1', quantity: 1 },
      // P3 (holds R3) also wants R1 → also blocked by P1 — star spoke
      { processId: 'P3', resourceId: 'R1', quantity: 1 },
    ],
  },
  'Double Deadlock': {
    description: 'Two independent deadlock cycles in the same system',
    tag: 'deadlock' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 1, status: 'running' as const },
      { id: 'P3', name: 'P3', priority: 1, status: 'running' as const },
      { id: 'P4', name: 'P4', priority: 1, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 1 },
      { id: 'R2', name: 'R2', instances: 1 },
      { id: 'R3', name: 'R3', instances: 1 },
      { id: 'R4', name: 'R4', instances: 1 },
    ],
    allocations: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
      { processId: 'P3', resourceId: 'R3', quantity: 1 },
      { processId: 'P4', resourceId: 'R4', quantity: 1 },
    ],
    requests: [
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
      { processId: 'P2', resourceId: 'R1', quantity: 1 },
      { processId: 'P3', resourceId: 'R4', quantity: 1 },
      { processId: 'P4', resourceId: 'R3', quantity: 1 },
    ],
  },
  'Priority Deadlock': {
    description: 'High-priority process blocked by low-priority one',
    tag: 'deadlock' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 10, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 1,  status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 1 },
      { id: 'R2', name: 'R2', instances: 1 },
    ],
    allocations: [
      { processId: 'P2', resourceId: 'R1', quantity: 1 },
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
    ],
    requests: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
    ],
  },

  // ── Safe / no-deadlock scenarios ────────────────────────
  'Safe State': {
    description: 'No cycle — system can complete all processes',
    tag: 'safe' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 2, status: 'running' as const },
      { id: 'P3', name: 'P3', priority: 3, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 2 },
      { id: 'R2', name: 'R2', instances: 3 },
    ],
    allocations: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
    ],
    requests: [
      { processId: 'P3', resourceId: 'R1', quantity: 1 },
    ],
  },
  'Shared Resource': {
    description: 'Multiple instances prevent deadlock from forming',
    tag: 'safe' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 1, status: 'running' as const },
      { id: 'P3', name: 'P3', priority: 2, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 3 },
      { id: 'R2', name: 'R2', instances: 2 },
    ],
    allocations: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R1', quantity: 1 },
      { processId: 'P3', resourceId: 'R2', quantity: 1 },
    ],
    requests: [
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
      { processId: 'P2', resourceId: 'R2', quantity: 1 },
    ],
  },
  'Banker Safe': {
    description: "Banker's algorithm — all processes can finish in order",
    tag: 'safe' as const,
    processes: [
      { id: 'P1', name: 'P1', priority: 1, status: 'running' as const },
      { id: 'P2', name: 'P2', priority: 2, status: 'running' as const },
      { id: 'P3', name: 'P3', priority: 3, status: 'running' as const },
      { id: 'P4', name: 'P4', priority: 4, status: 'running' as const },
    ],
    resources: [
      { id: 'R1', name: 'R1', instances: 4 },
      { id: 'R2', name: 'R2', instances: 4 },
    ],
    allocations: [
      { processId: 'P1', resourceId: 'R1', quantity: 1 },
      { processId: 'P2', resourceId: 'R1', quantity: 1 },
      { processId: 'P3', resourceId: 'R2', quantity: 1 },
      { processId: 'P4', resourceId: 'R2', quantity: 1 },
    ],
    requests: [
      { processId: 'P1', resourceId: 'R2', quantity: 1 },
      { processId: 'P3', resourceId: 'R1', quantity: 1 },
    ],
  },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

/* ─── Simulation step type ─────────────────────────────── */
interface SimStep {
  label: string;
  analysis: DeadlockAnalysis;
  resolutions: ResolutionStrategy[];
  processes: Process[];
  resources: Resource[];
  allocations: Allocation[];
  requests: DeadlockRequest[];
  /** Processes being terminated in THIS transition */
  removingProcesses: string[];
  /** Processes already removed before this step */
  removedProcesses: string[];
}

/* ─── score colour helper ──────────────────────────────── */
function scoreColor(score: number) {
  if (score >= 8) return { bg: 'bg-emerald-600', text: 'text-white' };
  if (score >= 5) return { bg: 'bg-amber-500', text: 'text-white' };
  return { bg: 'bg-red-600', text: 'text-white' };
}

/* ─── Condition row ────────────────────────────────────── */
function ConditionRow({
  label,
  subtitle,
  present,
}: {
  label: string;
  subtitle: string;
  present: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-2">
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
            present ? 'bg-red-500/20 border border-red-500/50' : 'bg-muted border border-border'
          }`}
        >
          <CheckCircle2
            className={`w-3.5 h-3.5 ${present ? 'text-red-400' : 'text-muted-foreground'}`}
          />
        </div>
        <div>
          <p className="text-xs font-medium">{label}</p>
          <p className="text-[10px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <span
        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
          present
            ? 'text-red-400 bg-red-500/10 border border-red-500/20'
            : 'text-muted-foreground bg-muted/60'
        }`}
      >
        {present ? 'Present' : 'Absent'}
      </span>
    </div>
  );
}

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
  const [activeScenario, setActiveScenario] = useState<ScenarioKey | null>(null);
  const [appliedFix, setAppliedFix] = useState<number | null>(null);
  const [fixLoading, setFixLoading] = useState<number | null>(null);

  // Simulation state
  const [simulating, setSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simSteps, setSimSteps] = useState<SimStep[]>([]);
  // The original full analysis kept for graph rendering during simulation
  const [baseAnalysis, setBaseAnalysis] = useState<any>(null);
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Stored form data
  const [currentFormData, setCurrentFormData] = useState<{
    processes: Process[];
    resources: Resource[];
    allocations: Allocation[];
    requests: DeadlockRequest[];
  } | null>(null);

  const [deadlockContext, setDeadlockContext] = useState<{
    deadlockedProcesses: string[];
    cycles: string[][];
    processes: Process[];
    resources: Resource[];
    allocations: Allocation[];
    requests: DeadlockRequest[];
  } | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) router.push('/auth/signin');
  }, [user, authLoading, router]);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
    };
  }, []);

  const runAnalysis = async (
    processes: Process[],
    resources: Resource[],
    allocations: Allocation[],
    requests: DeadlockRequest[]
  ) => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ processes, resources, allocations, requests }),
    });
    return response.json();
  };

  const handleAnalyze = async (
    processes: Process[],
    resources: Resource[],
    allocations: Allocation[],
    requests: DeadlockRequest[]
  ) => {
    setLoading(true);
    setAppliedFix(null);
    stopSimulation();
    try {
      const data = await runAnalysis(processes, resources, allocations, requests);
      if (!data?.analysis) {
        console.error('API failed:', data);
        alert('Analysis failed. Check console.');
        return;
      }
      setAnalysis(data.analysis);
      setResolutions(data.resolutions);
      setCurrentFormData({ processes, resources, allocations, requests });

      if (data.analysis.hasDeadlock) {
        const ctx = {
          deadlockedProcesses: data.analysis.deadlockedProcesses,
          cycles: data.analysis.cycles,
          processes,
          resources,
          allocations,
          requests,
        };
        setDeadlockContext(ctx);
        initializeChat(ctx);
      }
    } catch (err) {
      console.error('Analysis error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* ── Load preset scenario ── */
  const loadScenario = async (key: ScenarioKey) => {
    setActiveScenario(key);
    setAppliedFix(null);
    stopSimulation();
    const s = SCENARIOS[key];
    await handleAnalyze([...s.processes], [...s.resources], [...s.allocations], [...s.requests]);
  };

  /* ── Apply Fix ── */
  const applyFix = async (idx: number, strategy: ResolutionStrategy) => {
    if (!currentFormData) return;
    setFixLoading(idx);
    setAppliedFix(null);
    try {
      const affectedSet = new Set(strategy.affectedProcesses);
      const newProcesses = currentFormData.processes.filter(
        (p) => !affectedSet.has(p.id) && !affectedSet.has(p.name)
      );
      const newAllocations = currentFormData.allocations.filter(
        (a) => !affectedSet.has(a.processId)
      );
      const newRequests = currentFormData.requests.filter(
        (r) => !affectedSet.has(r.processId)
      );
      const data = await runAnalysis(
        newProcesses,
        currentFormData.resources,
        newAllocations,
        newRequests
      );
      if (data?.analysis) {
        setAnalysis(data.analysis);
        setResolutions(data.resolutions);
        setCurrentFormData({
          processes: newProcesses,
          resources: currentFormData.resources,
          allocations: newAllocations,
          requests: newRequests,
        });
        setAppliedFix(idx);
      }
    } catch (err) {
      console.error('Fix error:', err);
    } finally {
      setFixLoading(null);
    }
  };

  /* ── Simulation ── */
  const buildSimSteps = async (): Promise<SimStep[]> => {
    if (!currentFormData) return [];
    const { processes, resources, allocations, requests } = currentFormData;
    const steps: SimStep[] = [];

    const initial = await runAnalysis(processes, resources, allocations, requests);
    steps.push({
      label: 'Initial State',
      analysis: initial.analysis,
      resolutions: initial.resolutions ?? [],
      processes, resources, allocations, requests,
      removingProcesses: [],
      removedProcesses: [],
    });

    if (!initial.analysis?.hasDeadlock) return steps;

    let curProcesses = [...processes];
    let curAllocations = [...allocations];
    let curRequests = [...requests];
    const totalRemoved: string[] = [];

    for (const strategy of initial.resolutions ?? []) {
      const affectedSet = new Set(strategy.affectedProcesses);
      const nowRemoving = curProcesses
        .filter((p) => affectedSet.has(p.id) || affectedSet.has(p.name))
        .map((p) => p.id);

      curProcesses = curProcesses.filter(
        (p) => !affectedSet.has(p.id) && !affectedSet.has(p.name)
      );
      curAllocations = curAllocations.filter((a) => !affectedSet.has(a.processId));
      curRequests = curRequests.filter((r) => !affectedSet.has(r.processId));

      const stepData = await runAnalysis(curProcesses, resources, curAllocations, curRequests);
      if (!stepData?.analysis) break;

      const removedSoFar = [...totalRemoved];
      totalRemoved.push(...nowRemoving);

      steps.push({
        label: `Terminate ${nowRemoving.join(', ')}`,
        analysis: stepData.analysis,
        resolutions: stepData.resolutions ?? [],
        processes: curProcesses,
        resources,
        allocations: curAllocations,
        requests: curRequests,
        removingProcesses: nowRemoving,
        removedProcesses: removedSoFar,
      });

      if (!stepData.analysis.hasDeadlock) break;
    }
    return steps;
  };

  const stopSimulation = () => {
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimulating(false);
    setSimSteps([]);
    setSimStep(0);
  };

  const startSimulation = async () => {
    if (!currentFormData) return;
    setLoading(true);
    stopSimulation();
    try {
      const steps = await buildSimSteps();
      if (steps.length === 0) return;
      setSimSteps(steps);
      setSimStep(0);
      // Store the FULL initial analysis for graph — never replaced during sim
      setBaseAnalysis(steps[0].analysis);
      setResolutions(steps[0].resolutions);
      setSimulating(true);

      let idx = 0;
      simIntervalRef.current = setInterval(() => {
        idx++;
        if (idx >= steps.length) {
          clearInterval(simIntervalRef.current!);
          simIntervalRef.current = null;
          setSimulating(false);
          // Only now update the real analysis to final resolved state
          setAnalysis(steps[steps.length - 1].analysis);
          setResolutions(steps[steps.length - 1].resolutions);
          return;
        }
        setSimStep(idx);
        setResolutions(steps[idx].resolutions);
      }, 2000);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToSimStep = (idx: number) => {
    if (idx < 0 || idx >= simSteps.length) return;
    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
      simIntervalRef.current = null;
    }
    setSimStep(idx);
    setResolutions(simSteps[idx].resolutions);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const dl = analysis?.hasDeadlock ?? false;
  const analyzed = analysis !== null;

  return (
    <div className="dashboard-root bg-background text-foreground">

      {/* ══════════════════ HEADER ══════════════════ */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl">
        <div className="px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold leading-tight tracking-tight truncate">
                Deadlock Detector
              </h1>
              <p className="text-[11px] text-muted-foreground truncate hidden sm:block">
                Analyze system state, visualize cycles, and resolve deadlocks faster.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden md:block px-1">
              {user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={() => setAssistantOpen(true)} className="gap-1.5">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button size="sm" onClick={() => signOut()} className="gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* ── Scenario Presets + Simulate bar ── */}
        <div className="px-5 pb-2.5 flex items-center gap-2 flex-wrap border-t border-border/40 pt-2">
          <span className="text-[11px] text-muted-foreground font-medium mr-1 shrink-0">Presets:</span>
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((key) => {
            const scenario = SCENARIOS[key];
            const isDeadlock = scenario.tag === 'deadlock';
            const isActive = activeScenario === key;
            const isThisLoading = loading && isActive;
            return (
              <div key={key} className="relative group">
                <button
                  onClick={() => loadScenario(key)}
                  disabled={loading}
                  title={scenario.description}
                  className={`relative h-7 px-3 rounded-full text-[11px] font-semibold transition-all border flex items-center gap-1.5 ${
                    isActive
                      ? isDeadlock
                        ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/30'
                        : 'bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-500/30'
                      : isDeadlock
                        ? 'bg-card text-muted-foreground border-border hover:border-red-500/60 hover:text-red-400'
                        : 'bg-card text-muted-foreground border-border hover:border-emerald-500/60 hover:text-emerald-400'
                  }`}
                >
                  {isThisLoading ? (
                    <Spinner className="w-3 h-3" />
                  ) : (
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      isActive ? 'bg-white/80' : isDeadlock ? 'bg-red-500' : 'bg-emerald-500'
                    }`} />
                  )}
                  {key}
                </button>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-[10px] text-muted-foreground shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-50 leading-relaxed">
                  <p className={`font-semibold mb-0.5 ${isDeadlock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {isDeadlock ? '⚠ Deadlock' : '✓ Safe State'}
                  </p>
                  {scenario.description}
                </div>
              </div>
            );
          })}

          <div className="flex-1" />

          {/* Simulate controls */}
          {!simulating ? (
            <button
              onClick={startSimulation}
              disabled={!analyzed || loading}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold border border-primary/50 text-primary hover:bg-primary/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play className="w-3 h-3" />
              Simulate
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => goToSimStep(simStep - 1)}
                disabled={simStep === 0}
                className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] text-muted-foreground px-1 min-w-[90px] text-center truncate">
                {simSteps[simStep]?.label ?? `Step ${simStep + 1}`}
              </span>
              <button
                onClick={() => goToSimStep(simStep + 1)}
                disabled={simStep >= simSteps.length - 1}
                className="w-7 h-7 rounded border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={stopSimulation}
                className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[11px] font-semibold border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors ml-1"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ══════════════════ MAIN 3-COLUMN GRID ══════════════════ */}
      <main className="dashboard-main grid grid-cols-1 xl:grid-cols-[380px_1fr_290px]">

        {/* ── LEFT: System Configuration ─────────────────────── */}
        <aside className="dashboard-col border-r border-border bg-card/60 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold">System Configuration</h2>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <DataInputForm onAnalyze={handleAnalyze} loading={loading} />
          </div>
        </aside>

        {/* ── CENTER: System Graph ────────────────────────────── */}
        <div className="flex flex-col border-r border-border bg-background" style={{ height: '100%', overflow: 'hidden' }}>
          <div className="px-5 py-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold">System Graph</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Visual representation of processes, resources, allocations, and requests.
                </p>
              </div>
              {analyzed && (
                <div
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                    dl
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full animate-pulse ${dl ? 'bg-red-400' : 'bg-emerald-400'}`} />
                  {dl ? 'DEADLOCK DETECTED' : 'SAFE STATE'}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                Process
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-primary inline-block" />
                Resource
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0 border-t-2 border-amber-400 inline-block" />
                Allocated
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-5 h-0 border-t-2 border-dashed border-red-500 inline-block" />
                Request
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0">
            {analysis ? (
              <DeadlockGraph
                analysis={simulating && baseAnalysis ? baseAnalysis : analysis}
                simulationState={
                  simulating && simSteps.length > 0
                    ? {
                        step: simStep,
                        totalSteps: simSteps.length,
                        label: simSteps[simStep]?.label ?? '',
                        removingProcesses: simSteps[simStep]?.removingProcesses ?? [],
                        removedProcesses: simSteps[simStep]?.removedProcesses ?? [],
                        resolved: !(simSteps[simStep]?.analysis?.hasDeadlock ?? true),
                      }
                    : null
                }
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground p-8">
                <ShieldAlert className="w-12 h-12 opacity-20" />
                <p className="text-sm text-center">
                  Configure your system and run analysis to see the graph.
                </p>
              </div>
            )}
          </div>

          {/* Simulation progress bar */}
          {simulating && simSteps.length > 0 && (
            <div className="border-t border-border px-5 py-2 bg-card/60 flex items-center gap-3">
              <Zap className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-700 rounded-full"
                  style={{ width: `${((simStep + 1) / simSteps.length) * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {simStep + 1}/{simSteps.length}
              </span>
            </div>
          )}

          {/* Stats footer */}
          {analyzed && (
            <div className="border-t border-border px-5 py-2.5 bg-card/60 flex items-center gap-6">
              <div className="text-center">
                <p className={`text-lg font-bold ${dl ? 'text-red-400' : 'text-emerald-400'}`}>
                  {analysis?.deadlockedProcesses?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Deadlocked</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {analysis?.cycles?.reduce((acc, c) => Math.max(acc, c.length), 0) ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cycle Len</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">
                  {analysis?.cycles?.length ?? 0}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Cycles</p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: Analysis Panel ──────────────────────────── */}
        <div className="dashboard-col bg-card/60 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* CONDITIONS section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <ShieldAlert className="w-3.5 h-3.5 text-primary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Conditions
                </h2>
              </div>
              <div className="rounded-lg border border-border bg-background/60 px-3 py-1">
                <ConditionRow
                  label="Mutual Exclusion"
                  subtitle="Resources cannot be shared"
                  present={dl}
                />
                <ConditionRow
                  label="Hold and Wait"
                  subtitle="Processes hold & request more"
                  present={dl}
                />
                <ConditionRow
                  label="No Preemption"
                  subtitle="Resources not forcibly released"
                  present={dl}
                />
                <ConditionRow
                  label="Circular Wait"
                  subtitle="Cycle of process-resource dependency"
                  present={dl}
                />
              </div>
            </div>

            {/* RESOLUTION section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Resolution
                </h2>
              </div>

              {!analyzed ? (
                <p className="text-xs text-muted-foreground">
                  Run an analysis to see resolution strategies.
                </p>
              ) : !dl ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs font-semibold text-emerald-400">No Deadlock Detected</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">{analysis?.explanation}</p>
                </div>
              ) : resolutions.length === 0 ? (
                <p className="text-xs text-muted-foreground">No resolution strategies available.</p>
              ) : (
                <div className="space-y-3">
                  {resolutions.map((strategy, idx) => {
                    const score = 11 - strategy.cost;
                    const { bg, text } = scoreColor(score);
                    const isApplied = appliedFix === idx;
                    const isFixing = fixLoading === idx;
                    return (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 transition-all ${
                          isApplied
                            ? 'border-emerald-500/50 bg-emerald-500/10'
                            : 'border-border bg-background/60 hover:bg-muted/30'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <p className="text-xs font-semibold capitalize leading-tight">
                            {strategy.type === 'termination' && strategy.affectedProcesses[0]
                              ? `Terminate ${strategy.affectedProcesses[0]}`
                              : strategy.type === 'preemption'
                              ? 'Preempt resource allocation'
                              : strategy.description}
                          </p>
                          <span
                            className={`shrink-0 text-[11px] font-bold px-1.5 py-0.5 rounded ${bg} ${text}`}
                          >
                            {score}/10
                          </span>
                        </div>

                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">
                          {strategy.explanation}
                        </p>
                        <div className="flex gap-3 text-[10px] text-muted-foreground mb-2.5">
                          <span>Type: {strategy.type}</span>
                          <span>Cost: {strategy.cost}/10</span>
                        </div>

                        {isApplied ? (
                          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Fix Applied — Deadlock Resolved
                          </div>
                        ) : (
                          <button
                            onClick={() => applyFix(idx, strategy)}
                            disabled={isFixing || fixLoading !== null}
                            className="w-full flex items-center justify-center gap-1.5 h-7 rounded border border-primary/50 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isFixing ? (
                              <>
                                <Spinner className="w-3 h-3" />
                                Applying...
                              </>
                            ) : (
                              <>
                                <Wrench className="w-3 h-3" />
                                Apply Fix →
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ══════════════════ ASSISTANT DRAWER ══════════════════ */}
      <DeadlockAssistant
        isOpen={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        deadlockContext={deadlockContext}
        messages={messages}
        onSendMessage={async (msg) => await sendMessage(msg, deadlockContext)}
        loading={chatLoading}
        error={chatError}
      />
    </div>
  );
}
