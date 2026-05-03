import type {
  Process,
  Resource,
  Allocation,
  Request,
  DeadlockAnalysis,
  CycleDetail,
  ResolutionStrategy,
} from './types';
import { buildRAG, reduceRAGToProcessGraph, getNodeName } from './graph';
import { findProcessCycles, getNodesInCycles } from './cycleDetection';
import { generateResolutionStrategies } from './deadlockResolver';

/**
 * Main deadlock detection function
 * Analyzes the current system state and returns deadlock status
 */
export function detectDeadlock(
  processes: Process[],
  resources: Resource[],
  allocations: Allocation[],
  requests: Request[]
): DeadlockAnalysis {
  // Build the Resource Allocation Graph
  const rag = buildRAG(processes, resources, allocations, requests);

  // Reduce to process-only graph for cycle detection
  const processGraph = reduceRAGToProcessGraph(rag);

  // Find cycles in the process graph
  const cycles = findProcessCycles(processGraph);

  // If no cycles, no deadlock
  if (cycles.length === 0) {
    return {
      hasDeadlock: false,
      deadlockedProcesses: [],
      cycles: [],
      cycleDetails: [],
      explanation:
        'No deadlock detected. The system is in a safe state with no circular wait conditions.',
    };
  }

  // Get processes involved in cycles
  const deadlockedProcessIds = getNodesInCycles(processGraph, cycles);
  const deadlockedProcesses = Array.from(deadlockedProcessIds);

  // Create detailed cycle information
  const cycleDetails: CycleDetail[] = cycles.map((cycle) => {
    const processNames = cycle.map((id) => getNodeName(rag, id));
    
    // Find resources involved in this cycle
    const resourcesInCycle = new Set<string>();
    for (let i = 0; i < cycle.length - 1; i++) {
      const from = cycle[i];
      const to = cycle[i + 1];
      
      // Find the resource edge between these processes
      for (const edge of rag.edges) {
        if (
          (edge.from === from && edge.to === to) ||
          (edge.from === to && edge.to === from)
        ) {
          const allEdges = rag.edges.filter((e) => e.from === from && e.to === to);
          for (const e of allEdges) {
            if (rag.nodes.some((n) => n.id === e.to && n.type === 'resource')) {
              resourcesInCycle.add(getNodeName(rag, e.to));
            }
          }
        }
      }
    }

    return {
      cycle: processNames,
      resources: Array.from(resourcesInCycle),
      processes: processNames,
    };
  });

  const explanation =
    `Deadlock detected! ${cycles.length} circular wait cycle(s) found involving ${deadlockedProcesses.length} process(es). ` +
    `The processes are: ${deadlockedProcesses.map((id) => `"${getNodeName(rag, id)}"`).join(', ')}. ` +
    `All four deadlock conditions are present: Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait.`;

  return {
    hasDeadlock: true,
    deadlockedProcesses,
    cycles: cycles.map((c) => c.map((id) => getNodeName(rag, id))),
    cycleDetails,
    explanation,
  };
}

/**
 * Get resolution strategies for detected deadlock
 */
export function getDeadlockResolutions(
  analysis: DeadlockAnalysis,
  processes: Process[],
  resources: Resource[],
  allocations: Allocation[],
  requests: Request[]
): ResolutionStrategy[] {
  if (!analysis.hasDeadlock) {
    return [];
  }

  const rag = buildRAG(processes, resources, allocations, requests);

  return generateResolutionStrategies(
    rag,
    analysis.deadlockedProcesses,
    processes,
    resources,
    requests
  );
}

export * from './types';
export { buildRAG, reduceRAGToProcessGraph } from './graph';
export { findProcessCycles, hasCycle } from './cycleDetection';
export { generateResolutionStrategies, simulateProcessRemoval } from './deadlockResolver';
