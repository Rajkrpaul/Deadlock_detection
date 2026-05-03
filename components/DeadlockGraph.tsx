'use client';

import React, { useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  Node,
  Edge,
  MarkerType,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

export interface SimulationState {
  step: number;
  totalSteps: number;
  label: string;
  removingProcesses: string[];
  removedProcesses: string[];
  resolved: boolean;
}

interface DeadlockGraphProps {
  analysis: any;
  simulationState?: SimulationState | null;
}

function buildGraph(
  analysis: any,
  removingProcesses: string[],
  removedProcesses: string[],
  resolved: boolean
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  if (!analysis) return { nodes, edges };

  const isDeadlock = analysis.hasDeadlock;
  const deadlocked = new Set<string>(analysis.deadlockedProcesses ?? []);
  const removing   = new Set(removingProcesses);
  const removed    = new Set(removedProcesses);

  // Process nodes
  analysis.processes?.forEach((p: any, index: number) => {
    const isRemoving = removing.has(p.id);
    const isRemoved  = removed.has(p.id);
    const isInCycle  = deadlocked.has(p.id) && isDeadlock && !resolved;

    let bg      = '#22c55e';
    let border  = 'none';
    let glow    = 'none';
    let opacity = 1;

    if (isRemoving) {
      bg      = '#ef4444';
      border  = '3px solid #fca5a5';
      glow    = '0 0 20px 6px rgba(239,68,68,0.7)';
      opacity = 0.75;
    } else if (isRemoved) {
      bg      = '#1f2937';
      border  = '2px solid #374151';
      opacity = 0.2;
    } else if (resolved) {
      bg   = '#16a34a';
      glow = '0 0 12px 3px rgba(34,197,94,0.4)';
    } else if (isInCycle) {
      bg     = '#dc2626';
      border = '3px solid #fca5a5';
      glow   = '0 0 14px 3px rgba(220,38,38,0.5)';
    }

    nodes.push({
      id: p.id,
      data: { label: isRemoved ? '✕' : p.id },
      position: { x: 100, y: 60 + index * 160 },
      style: {
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: bg,
        color: '#fff',
        border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isRemoved ? 20 : 15,
        fontWeight: 700,
        opacity,
        transition: 'all 0.5s ease',
        boxShadow: glow,
      },
    });
  });

  // Resource nodes
  analysis.resources?.forEach((r: any, index: number) => {
    nodes.push({
      id: r.id,
      data: { label: r.id },
      position: { x: 380, y: 60 + index * 160 },
      style: {
        width: 64,
        height: 64,
        borderRadius: 10,
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        border: resolved ? '2px solid #22c55e' : '2px solid hsl(var(--primary))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 700,
        transition: 'all 0.5s ease',
        boxShadow: resolved ? '0 0 10px 2px rgba(34,197,94,0.3)' : 'none',
      },
    });
  });

  // Allocation edges (Resource → Process)
  analysis.allocations?.forEach((a: any, i: number) => {
    const procRemoving = removing.has(a.processId);
    const procRemoved  = removed.has(a.processId);
    const color = procRemoving ? '#ef4444' : resolved ? '#22c55e' : '#f59e0b';
    edges.push({
      id: `alloc-${i}`,
      source: a.resourceId,
      target: a.processId,
      animated: procRemoving,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
      style: {
        stroke: color,
        strokeWidth: procRemoving ? 3 : 2,
        opacity: procRemoved ? 0.1 : procRemoving ? 0.85 : 1,
        transition: 'all 0.5s ease',
        strokeDasharray: procRemoving ? '4 3' : undefined,
      },
    });
  });

  // Request edges (Process → Resource)
  analysis.requests?.forEach((r: any, i: number) => {
    const procRemoving = removing.has(r.processId);
    const procRemoved  = removed.has(r.processId);
    const color = procRemoving ? '#ef4444' : resolved ? '#22c55e' : '#ef4444';
    edges.push({
      id: `req-${i}`,
      source: r.processId,
      target: r.resourceId,
      animated: (isDeadlock && !resolved && !procRemoved) || procRemoving,
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 18, height: 18 },
      style: {
        stroke: color,
        strokeWidth: procRemoving ? 3 : 2,
        strokeDasharray: procRemoving
          ? '4 3'
          : isDeadlock && !resolved
          ? '6 3'
          : undefined,
        opacity: procRemoved ? 0.1 : procRemoving ? 0.85 : 1,
        transition: 'all 0.5s ease',
      },
    });
  });

  return { nodes, edges };
}

export function DeadlockGraph({ analysis, simulationState }: DeadlockGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const prevKeyRef = useRef<string>('');
  const timerRef   = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!analysis) return;

    const sim      = simulationState;
    const removing = sim?.removingProcesses ?? [];
    const removed  = sim?.removedProcesses  ?? [];
    const resolved = sim?.resolved          ?? false;

    // Stable string key — only re-animate when step actually changes
    const stepKey = sim
      ? `${sim.step}|${removing.join(',')}|${removed.join(',')}|${resolved}`
      : 'none';

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const isNewStep = stepKey !== prevKeyRef.current;
    prevKeyRef.current = stepKey;

    if (isNewStep && removing.length > 0) {
      // Phase 1 — flash nodes being removed (bright red + glow)
      const { nodes: n1, edges: e1 } = buildGraph(analysis, removing, removed, false);
      setNodes(n1);
      setEdges(e1);

      // Phase 2 — ghost them out after flash
      timerRef.current = setTimeout(() => {
        const allRemoved = [...removed, ...removing];
        const { nodes: n2, edges: e2 } = buildGraph(analysis, [], allRemoved, resolved);
        setNodes(n2);
        setEdges(e2);
        timerRef.current = null;
      }, 650);
    } else {
      const { nodes: n, edges: e } = buildGraph(analysis, removing, removed, resolved);
      setNodes(n);
      setEdges(e);
    }
  // Primitive deps so React correctly detects changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    analysis,
    simulationState?.step,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    simulationState?.removingProcesses?.join(','),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    simulationState?.removedProcesses?.join(','),
    simulationState?.resolved,
  ]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!analysis) return null;

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 340 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        nodesDraggable
        nodesConnectable={false}
        elementsSelectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="hsl(var(--border))" />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
}
