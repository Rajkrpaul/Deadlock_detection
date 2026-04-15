import type {
  Process,
  Resource,
  Request,
  ResolutionStrategy,
  ResourceAllocationGraph,
} from './types';
import { getNodeName } from './graph';

/**
 * Generate resolution strategies for a deadlock
 */
export function generateResolutionStrategies(
  rag: ResourceAllocationGraph,
  deadlockedProcesses: string[],
  processes: Process[],
  resources: Resource[],
  requests: Request[]
): ResolutionStrategy[] {
  const strategies: ResolutionStrategy[] = [];

  // Strategy 1: Terminate lowest priority process
  const lowestPriorityProcess = deadlockedProcesses.reduce((lowest, current) => {
    const lowestProc = processes.find((p) => p.id === lowest);
    const currentProc = processes.find((p) => p.id === current);
    const lowestPriority = lowestProc?.priority ?? 0;
    const currentPriority = currentProc?.priority ?? 0;
    return currentPriority < lowestPriority ? current : lowest;
  });

  if (lowestPriorityProcess) {
    strategies.push({
      type: 'termination',
      description: `Terminate process "${getNodeName(rag, lowestPriorityProcess)}"`,
      affectedProcesses: [lowestPriorityProcess],
      cost: 8,
      explanation: `Forcefully terminating the lowest priority process (${getNodeName(
        rag,
        lowestPriorityProcess
      )}) will break the deadlock cycle. However, this process will lose all progress and may lose unsaved data. This is the most disruptive solution but guarantees deadlock resolution.`,
    });
  }

  // Strategy 2: Preempt resources from highest priority process
  const highestPriorityDeadlocked = deadlockedProcesses.reduce(
    (highest, current) => {
      const highestProc = processes.find((p) => p.id === highest);
      const currentProc = processes.find((p) => p.id === current);
      const highestPriority = highestProc?.priority ?? 0;
      const currentPriority = currentProc?.priority ?? 0;
      return currentPriority > highestPriority ? current : highest;
    }
  );

  if (highestPriorityDeadlocked) {
    strategies.push({
      type: 'preemption',
      description: `Preempt resources from process "${getNodeName(
        rag,
        highestPriorityDeadlocked
      )}"`,
      affectedProcesses: [highestPriorityDeadlocked],
      cost: 6,
      explanation: `Temporarily preempt (take away) resources held by the highest priority deadlocked process. This process will be blocked but can resume when resources become available. This is less disruptive than termination but requires careful state management.`,
    });
  }

  // Strategy 3: Reorder process execution
  const sortedByPriority = [...deadlockedProcesses].sort((a, b) => {
    const procA = processes.find((p) => p.id === a);
    const procB = processes.find((p) => p.id === b);
    return (procB?.priority ?? 0) - (procA?.priority ?? 0);
  });

  if (sortedByPriority.length > 1) {
    strategies.push({
      type: 'reordering',
      description: `Reorder process execution by priority`,
      affectedProcesses: deadlockedProcesses,
      cost: 3,
      explanation: `Allow the highest priority process to proceed first by temporarily blocking lower priority processes. This breaks the circular wait condition. This approach preserves all processes and data but requires careful scheduling.`,
    });
  }

  // Strategy 4: Banker's Algorithm (Avoidance)
  strategies.push({
    type: 'avoidance',
    description: `Apply safe-state checking (Banker's Algorithm)`,
    affectedProcesses: [],
    cost: 2,
    explanation: `Analyze the system using Banker's Algorithm to identify a safe sequence of process execution. Only grant resource requests that would keep the system in a safe state. This prevents deadlocks proactively without disrupting running processes. Requires precomputing safe sequences but is the most elegant solution.`,
  });

  // Sort by cost (ascending) so least disruptive solutions come first
  return strategies.sort((a, b) => a.cost - b.cost);
}

/**
 * Simulate removing a process from the deadlock
 */
export function simulateProcessRemoval(
  rag: ResourceAllocationGraph,
  processToRemove: string
): ResourceAllocationGraph {
  return {
    nodes: rag.nodes.filter((n) => n.id !== processToRemove),
    edges: rag.edges.filter(
      (e) => e.from !== processToRemove && e.to !== processToRemove
    ),
  };
}

/**
 * Calculate the impact of a resolution strategy
 */
export function calculateStrategyImpact(
  strategy: ResolutionStrategy,
  processes: Process[]
): {
  affectedProcessCount: number;
  dataLoss: boolean;
  downtime: string;
} {
  return {
    affectedProcessCount: strategy.affectedProcesses.length,
    dataLoss: strategy.type === 'termination',
    downtime:
      strategy.type === 'termination'
        ? 'Permanent'
        : strategy.type === 'preemption'
          ? 'Until resources freed'
          : strategy.type === 'reordering'
            ? 'Brief'
            : 'None (preventive)',
  };
}
