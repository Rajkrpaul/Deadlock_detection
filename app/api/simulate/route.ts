import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { detectDeadlock, simulateProcessRemoval } from '@/lib/algorithms';
import type { Process, Resource, Allocation, Request as DeadlockRequest } from '@/lib/algorithms';

export async function POST(request: NextRequest) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const {
      processes,
      resources,
      allocations,
      requests,
      removeProcessId,
    } = await request.json();

    if (!processes || !resources || !removeProcessId) {
      return NextResponse.json(
        { error: 'Invalid input: processes, resources, and removeProcessId are required' },
        { status: 400 }
      );
    }

    // Run original deadlock detection
    const originalAnalysis = detectDeadlock(
      processes as Process[],
      resources as Resource[],
      allocations as Allocation[],
      requests as DeadlockRequest[]
    );

    // Build the graph and remove the process
    const { buildRAG } = await import('@/lib/algorithms');
    const rag = buildRAG(
      processes as Process[],
      resources as Resource[],
      allocations as Allocation[],
      requests as DeadlockRequest[]
    );

    const reducedRAG = simulateProcessRemoval(rag, removeProcessId);

    // Get processes and resources from reduced graph
    const remainingProcesses = processes.filter((p: Process) => p.id !== removeProcessId);
    const remainingAllocations = allocations.filter(
      (a: Allocation) => a.processId !== removeProcessId
    );
    const remainingRequests = requests.filter(
      (r: DeadlockRequest) => r.processId !== removeProcessId
    );

    // Run deadlock detection on the reduced system
    const simulatedAnalysis = detectDeadlock(
      remainingProcesses,
      resources as Resource[],
      remainingAllocations,
      remainingRequests
    );

    return NextResponse.json({
      originalAnalysis,
      simulatedAnalysis,
      removedProcess: removeProcessId,
      impact: {
        deadlockResolved: !simulatedAnalysis.hasDeadlock && originalAnalysis.hasDeadlock,
        affectedProcessCount: 1,
        remainingDeadlockedProcesses: simulatedAnalysis.deadlockedProcesses,
      },
    });
  } catch (error) {
    console.error('Simulate API error:', error);
    return NextResponse.json(
      { error: 'Failed to simulate process removal' },
      { status: 500 }
    );
  }
}
