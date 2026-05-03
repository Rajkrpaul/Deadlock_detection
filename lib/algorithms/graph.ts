import type {
  Process,
  Resource,
  Allocation,
  Request,
  ResourceAllocationGraph,
  Node,
  Edge,
} from './types';

/**
 * Build a Resource Allocation Graph from processes, resources, allocations, and requests
 */
export function buildRAG(
  processes: Process[],
  resources: Resource[],
  allocations: Allocation[],
  requests: Request[]
): ResourceAllocationGraph {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Add process nodes
  for (const process of processes) {
    nodes.push({
      type: 'process',
      id: process.id,
      name: process.name,
    });
  }

  // Add resource nodes
  for (const resource of resources) {
    nodes.push({
      type: 'resource',
      id: resource.id,
      name: resource.name,
    });
  }

  // Add allocation edges (resource -> process)
  for (const allocation of allocations) {
    edges.push({
      from: allocation.resourceId,
      to: allocation.processId,
      type: 'allocation',
    });
  }

  // Add request edges (process -> resource)
  for (const request of requests) {
    edges.push({
      from: request.processId,
      to: request.resourceId,
      type: 'request',
    });
  }

  return { nodes, edges };
}

/**
 * Get all neighbors (incoming and outgoing) of a node in the graph
 */
export function getNeighbors(
  rag: ResourceAllocationGraph,
  nodeId: string
): { incoming: string[]; outgoing: string[] } {
  const incoming: string[] = [];
  const outgoing: string[] = [];

  for (const edge of rag.edges) {
    if (edge.to === nodeId) {
      incoming.push(edge.from);
    }
    if (edge.from === nodeId) {
      outgoing.push(edge.to);
    }
  }

  return { incoming, outgoing };
}

/**
 * Get the type of a node
 */
export function getNodeType(
  rag: ResourceAllocationGraph,
  nodeId: string
): 'process' | 'resource' | null {
  const node = rag.nodes.find((n) => n.id === nodeId);
  return node?.type || null;
}

/**
 * Get node name for display
 */
export function getNodeName(
  rag: ResourceAllocationGraph,
  nodeId: string
): string {
  const node = rag.nodes.find((n) => n.id === nodeId);
  return node?.name || nodeId;
}

/**
 * Filter graph to only include process-to-process edges
 * (resource nodes act as intermediaries and are removed)
 */
export function reduceRAGToProcessGraph(
  rag: ResourceAllocationGraph
): ResourceAllocationGraph {
  const processIds = new Set(
    rag.nodes.filter((n) => n.type === 'process').map((n) => n.id)
  );

  const reducedNodes = rag.nodes.filter((n) => processIds.has(n.id));
  const reducedEdges: Edge[] = [];

  // For each resource, find all processes requesting it and all processes holding it
  const resourceNodes = rag.nodes.filter((n) => n.type === 'resource');

  for (const resource of resourceNodes) {
    const { incoming: holdingProcesses, outgoing: requestingProcesses } =
      getNeighbors(rag, resource.id);

    // Create edges from requesting processes to holding processes
    for (const requester of requestingProcesses) {
      for (const holder of holdingProcesses) {
        if (requester !== holder) {
          reducedEdges.push({
            from: requester,
            to: holder,
            type: 'request',
          });
        }
      }
    }
  }

  return {
    nodes: reducedNodes,
    edges: reducedEdges,
  };
}

/**
 * Get the subgraph containing only specified nodes
 */
export function getSubgraph(
  rag: ResourceAllocationGraph,
  nodeIds: Set<string>
): ResourceAllocationGraph {
  return {
    nodes: rag.nodes.filter((n) => nodeIds.has(n.id)),
    edges: rag.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to)),
  };
}
