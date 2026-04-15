export interface Process {
  id: string;
  name: string;
  priority: number;
  status: 'running' | 'blocked' | 'terminated';
}

export interface Resource {
  id: string;
  name: string;
  instances: number;
}

export interface Allocation {
  processId: string;
  resourceId: string;
  quantity: number;
}

export interface Request {
  processId: string;
  resourceId: string;
  quantity: number;
}

export interface Node {
  type: 'process' | 'resource';
  id: string;
  name: string;
}

export interface Edge {
  from: string;
  to: string;
  type: 'request' | 'allocation';
}

export interface ResourceAllocationGraph {
  nodes: Node[];
  edges: Edge[];
}

export interface DeadlockAnalysis {
  hasDeadlock: boolean;
  deadlockedProcesses: string[];
  cycles: string[][];
  cycleDetails: CycleDetail[];
  explanation: string;
}

export interface CycleDetail {
  cycle: string[];
  resources: string[];
  processes: string[];
}

export interface ResolutionStrategy {
  type: 'termination' | 'preemption' | 'reordering' | 'avoidance';
  description: string;
  affectedProcesses: string[];
  cost: number; // 0-10, higher = more disruptive
  explanation: string;
}
