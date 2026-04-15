'use client';

import React from 'react';
import ReactFlow, {
    Background,
    Controls,
    Node,
    Edge,
} from 'reactflow';
import 'reactflow/dist/style.css';

export function DeadlockGraph({ analysis }: any) {
    if (!analysis) return null;

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const isDeadlock = analysis.hasDeadlock;

    // 🟢 Process nodes
    analysis.processes?.forEach((p: any, index: number) => {
        nodes.push({
            id: p.id,
            data: { label: `🟢 ${p.id}` },
            position: { x: 100, y: index * 120 },
            style: {
                border: '1px solid hsl(var(--border))',
                padding: 12,
                borderRadius: 12,
                background: 'hsl(var(--card))',
                fontSize: 14,
                fontWeight: 500,
            },
        });
    });

    // 🔵 Resource nodes
    analysis.resources?.forEach((r: any, index: number) => {
        nodes.push({
            id: r.id,
            data: { label: `🔵 ${r.id}` },
            position: { x: 420, y: index * 120 },
            style: {
                border: '1px solid hsl(var(--border))',
                padding: 12,
                borderRadius: 12,
                background: 'hsl(var(--card))',
                fontSize: 14,
                fontWeight: 500,
            },
        });
    });

    // 🔁 Allocation edges (Resource → Process)
    analysis.allocations?.forEach((a: any, i: number) => {
        edges.push({
            id: `alloc-${i}`,
            source: a.resourceId,
            target: a.processId,
            label: 'alloc',
            animated: true,
            style: {
                stroke: isDeadlock ? '#ef4444' : '#888',
                strokeWidth: 2,
            },
            labelStyle: { fontSize: 10 },
        });
    });

    // 🔁 Request edges (Process → Resource)
    analysis.requests?.forEach((r: any, i: number) => {
        edges.push({
            id: `req-${i}`,
            source: r.processId,
            target: r.resourceId,
            label: 'req',
            animated: true,
            style: {
                stroke: isDeadlock ? '#ef4444' : '#f97316',
                strokeWidth: 2,
            },
            labelStyle: { fontSize: 10 },
        });
    });

    return (
        <div
            style={{
                height: 420,
                borderRadius: 12,
                overflow: 'hidden',
            }}
        >
            <ReactFlow nodes={nodes} edges={edges} fitView>
                <Background gap={16} size={1} />
                <Controls />
            </ReactFlow>
        </div>
    );
}