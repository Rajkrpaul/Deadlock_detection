'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';
import type { Process, Resource, Allocation, Request as DeadlockRequest } from '@/lib/algorithms';

interface DataInputFormProps {
  onAnalyze: (
    processes: Process[],
    resources: Resource[],
    allocations: Allocation[],
    requests: DeadlockRequest[]
  ) => void;
  loading?: boolean;
}

export function DataInputForm({ onAnalyze, loading = false }: DataInputFormProps) {
  const [processes, setProcesses] = useState<Process[]>([
    { id: 'P1', name: 'Process 1', priority: 0, status: 'running' },
  ]);

  const [resources, setResources] = useState<Resource[]>([
    { id: 'R1', name: 'Resource 1', instances: 1 },
  ]);

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [requests, setRequests] = useState<DeadlockRequest[]>([]);

  const handleAnalyze = () => {
    onAnalyze(processes, resources, allocations, requests);
  };

  const addProcess = () => {
    const newId = `P${processes.length + 1}`;
    setProcesses([
      ...processes,
      { id: newId, name: `Process ${processes.length + 1}`, priority: 0, status: 'running' },
    ]);
  };

  const removeProcess = (id: string) => {
    setProcesses(processes.filter((p) => p.id !== id));
    setAllocations(allocations.filter((a) => a.processId !== id));
    setRequests(requests.filter((r) => r.processId !== id));
  };

  const addResource = () => {
    const newId = `R${resources.length + 1}`;
    setResources([
      ...resources,
      { id: newId, name: `Resource ${resources.length + 1}`, instances: 1 },
    ]);
  };

  const removeResource = (id: string) => {
    setResources(resources.filter((r) => r.id !== id));
    setAllocations(allocations.filter((a) => a.resourceId !== id));
    setRequests(requests.filter((r) => r.resourceId !== id));
  };

  const addAllocation = () => {
    if (processes.length > 0 && resources.length > 0) {
      setAllocations([
        ...allocations,
        { processId: processes[0].id, resourceId: resources[0].id, quantity: 1 },
      ]);
    }
  };

  const removeAllocation = (idx: number) => {
    setAllocations(allocations.filter((_, i) => i !== idx));
  };

  const addRequest = () => {
    if (processes.length > 0 && resources.length > 0) {
      setRequests([
        ...requests,
        { processId: processes[0].id, resourceId: resources[0].id, quantity: 1 },
      ]);
    }
  };

  const removeRequest = (idx: number) => {
    setRequests(requests.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      {/* Processes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Processes</h3>
          <Button size="sm" onClick={addProcess}>
            <Plus className="w-4 h-4 mr-2" />
            Add Process
          </Button>
        </div>

        <div className="space-y-3">
          {processes.map((proc) => (
            <div key={proc.id} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={proc.name}
                  onChange={(e) =>
                    setProcesses(
                      processes.map((p) =>
                        p.id === proc.id ? { ...p, name: e.target.value } : p
                      )
                    )
                  }
                  placeholder="Process name"
                />
              </div>
              <div className="w-24">
                <label className="text-sm font-medium">Priority</label>
                <Input
                  type="number"
                  value={proc.priority}
                  onChange={(e) =>
                    setProcesses(
                      processes.map((p) =>
                        p.id === proc.id ? { ...p, priority: parseInt(e.target.value) } : p
                      )
                    )
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProcess(proc.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Resources */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Resources</h3>
          <Button size="sm" onClick={addResource}>
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>

        <div className="space-y-3">
          {resources.map((res) => (
            <div key={res.id} className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={res.name}
                  onChange={(e) =>
                    setResources(
                      resources.map((r) =>
                        r.id === res.id ? { ...r, name: e.target.value } : r
                      )
                    )
                  }
                  placeholder="Resource name"
                />
              </div>
              <div className="w-24">
                <label className="text-sm font-medium">Instances</label>
                <Input
                  type="number"
                  value={res.instances}
                  onChange={(e) =>
                    setResources(
                      resources.map((r) =>
                        r.id === res.id ? { ...r, instances: parseInt(e.target.value) } : r
                      )
                    )
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeResource(res.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Allocations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Allocations (currently held)</h3>
          <Button size="sm" onClick={addAllocation}>
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        </div>

        <div className="space-y-3">
          {allocations.map((alloc, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <select
                value={alloc.processId}
                onChange={(e) =>
                  setAllocations(
                    allocations.map((a, i) =>
                      i === idx ? { ...a, processId: e.target.value } : a
                    )
                  )
                }
                className="flex-1 px-3 py-2 border border-border rounded-md"
              >
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={alloc.resourceId}
                onChange={(e) =>
                  setAllocations(
                    allocations.map((a, i) =>
                      i === idx ? { ...a, resourceId: e.target.value } : a
                    )
                  )
                }
                className="flex-1 px-3 py-2 border border-border rounded-md"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <div className="w-20">
                <Input
                  type="number"
                  value={alloc.quantity}
                  onChange={(e) =>
                    setAllocations(
                      allocations.map((a, i) =>
                        i === idx ? { ...a, quantity: parseInt(e.target.value) } : a
                      )
                    )
                  }
                  min="1"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAllocation(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Requests */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Requests (waiting for)</h3>
          <Button size="sm" onClick={addRequest}>
            <Plus className="w-4 h-4 mr-2" />
            Add Request
          </Button>
        </div>

        <div className="space-y-3">
          {requests.map((req, idx) => (
            <div key={idx} className="flex gap-3 items-end">
              <select
                value={req.processId}
                onChange={(e) =>
                  setRequests(
                    requests.map((r, i) =>
                      i === idx ? { ...r, processId: e.target.value } : r
                    )
                  )
                }
                className="flex-1 px-3 py-2 border border-border rounded-md"
              >
                {processes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              <select
                value={req.resourceId}
                onChange={(e) =>
                  setRequests(
                    requests.map((r, i) =>
                      i === idx ? { ...r, resourceId: e.target.value } : r
                    )
                  )
                }
                className="flex-1 px-3 py-2 border border-border rounded-md"
              >
                {resources.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              <div className="w-20">
                <Input
                  type="number"
                  value={req.quantity}
                  onChange={(e) =>
                    setRequests(
                      requests.map((r, i) =>
                        i === idx ? { ...r, quantity: parseInt(e.target.value) } : r
                      )
                    )
                  }
                  min="1"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRequest(idx)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Analyze Button */}
      <Button
        onClick={handleAnalyze}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Analyzing...' : 'Analyze for Deadlock'}
      </Button>
    </div>
  );
}
