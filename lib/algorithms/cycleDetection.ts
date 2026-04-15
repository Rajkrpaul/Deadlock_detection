import type { ResourceAllocationGraph } from './types';

/**
 * Find all cycles in a graph using DFS
 * Returns array of cycles, where each cycle is an array of node IDs
 */
export function findCycles(rag: ResourceAllocationGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const parent = new Map<string, string>();

  function dfs(nodeId: string, path: string[]): void {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    // Get outgoing edges
    const neighbors = rag.edges
      .filter((e) => e.from === nodeId)
      .map((e) => e.to);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, nodeId);
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(neighbor);
          // Check if this cycle is not already found
          if (!isCycleDuplicate(cycles, cycle)) {
            cycles.push(cycle);
          }
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  // Run DFS from each node
  for (const node of rag.nodes) {
    if (!visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Find cycles involving only process nodes (reduced RAG)
 */
export function findProcessCycles(rag: ResourceAllocationGraph): string[][] {
  const processIds = new Set(
    rag.nodes.filter((n) => n.type === 'process').map((n) => n.id)
  );

  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(nodeId: string, path: string[]): void {
    if (!processIds.has(nodeId)) return;

    visited.add(nodeId);
    recursionStack.add(nodeId);
    path.push(nodeId);

    // Get outgoing edges to other processes only
    const neighbors = rag.edges
      .filter((e) => e.from === nodeId && processIds.has(e.to))
      .map((e) => e.to);

    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, [...path]);
      } else if (recursionStack.has(neighbor)) {
        // Found a cycle
        const cycleStart = path.indexOf(neighbor);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(neighbor);
          if (!isCycleDuplicate(cycles, cycle)) {
            cycles.push(cycle);
          }
        }
      }
    }

    recursionStack.delete(nodeId);
  }

  // Run DFS from each process node
  for (const node of rag.nodes) {
    if (node.type === 'process' && !visited.has(node.id)) {
      dfs(node.id, []);
    }
  }

  return cycles;
}

/**
 * Check if a cycle is already in the cycles array (accounting for rotations)
 */
function isCycleDuplicate(cycles: string[][], newCycle: string[]): boolean {
  for (const existing of cycles) {
    if (existing.length !== newCycle.length) continue;

    // Check if one cycle is a rotation of the other
    const doubledExisting = existing.concat(existing);
    const cycleStr = newCycle.slice(0, -1).join(','); // Remove last duplicate node

    for (let i = 0; i < existing.length; i++) {
      const rotated = doubledExisting
        .slice(i, i + existing.length)
        .slice(0, -1)
        .join(',');
      if (rotated === cycleStr) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Check if there is a cycle in the graph
 */
export function hasCycle(rag: ResourceAllocationGraph): boolean {
  const cycles = findCycles(rag);
  return cycles.length > 0;
}

/**
 * Get all nodes involved in any cycle
 */
export function getNodesInCycles(
  rag: ResourceAllocationGraph,
  cycles: string[][]
): Set<string> {
  const nodesInCycles = new Set<string>();

  for (const cycle of cycles) {
    for (const node of cycle) {
      nodesInCycles.add(node);
    }
  }

  return nodesInCycles;
}

/**
 * Check if two cycles share nodes
 */
export function cyclesShareNodes(cycle1: string[], cycle2: string[]): boolean {
  const set1 = new Set(cycle1);
  return cycle2.some((node) => set1.has(node));
}

/**
 * Group cycles by connected components
 */
export function groupCyclesByConnectivity(cycles: string[][]): string[][][] {
  if (cycles.length === 0) return [];

  const groups: string[][][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < cycles.length; i++) {
    if (assigned.has(i)) continue;

    const group: string[][] = [cycles[i]];
    assigned.add(i);

    for (let j = i + 1; j < cycles.length; j++) {
      if (assigned.has(j)) continue;

      // Check if cycle j shares nodes with any cycle in the group
      let sharesNode = false;
      for (const cycle of group) {
        if (cyclesShareNodes(cycle, cycles[j])) {
          sharesNode = true;
          break;
        }
      }

      if (sharesNode) {
        group.push(cycles[j]);
        assigned.add(j);
      }
    }

    groups.push(group);
  }

  return groups;
}
