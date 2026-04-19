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

  const sectionCardClass = 'p-5 sm:p-6 border border-border/80 shadow-sm rounded-xl bg-card/80 backdrop-blur';
  const rowClass = 'grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-2 items-end';
  const relationRowClass =
    'grid grid-cols-1 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1.35fr)_84px_36px] gap-2 items-end';
  const selectClass =
    'h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]';

  return (
    <div className="space-y-5">
      {/* Processes */}
      <Card className={sectionCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">Processes</h3>
            <p className="text-xs text-muted-foreground">Define runnable units and priority order.</p>
          </div>
          <Button size="sm" onClick={addProcess} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Process
          </Button>
        </div>

        <div className="space-y-3">
          {processes.map((proc) => (
            <div key={proc.id} className={rowClass}>
              <div className="sm:col-span-8">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
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
              <div className="sm:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <Input
                  type="number"
                  value={proc.priority}
                  onChange={(e) =>
                    setProcesses(
                      processes.map((p) =>
                        p.id === proc.id
                          ? { ...p, priority: Number.isNaN(parseInt(e.target.value, 10)) ? 0 : parseInt(e.target.value, 10) }
                          : p
                      )
                    )
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProcess(proc.id)}
                className="sm:col-span-1"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Resources */}
      <Card className={sectionCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">Resources</h3>
            <p className="text-xs text-muted-foreground">Define shared resource pools and capacity.</p>
          </div>
          <Button size="sm" onClick={addResource} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </Button>
        </div>

        <div className="space-y-3">
          {resources.map((res) => (
            <div key={res.id} className={rowClass}>
              <div className="sm:col-span-8">
                <label className="text-xs font-medium text-muted-foreground">Name</label>
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
              <div className="sm:col-span-3">
                <label className="text-xs font-medium text-muted-foreground">Instances</label>
                <Input
                  type="number"
                  value={res.instances}
                  onChange={(e) =>
                    setResources(
                      resources.map((r) =>
                        r.id === res.id
                          ? { ...r, instances: Math.max(1, Number.isNaN(parseInt(e.target.value, 10)) ? 1 : parseInt(e.target.value, 10)) }
                          : r
                      )
                    )
                  }
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeResource(res.id)}
                className="sm:col-span-1"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Allocations */}
      <Card className={sectionCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">Allocations</h3>
            <p className="text-xs text-muted-foreground">Resources currently held by each process.</p>
          </div>
          <Button size="sm" onClick={addAllocation} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Allocation
          </Button>
        </div>

        <div className="space-y-3">
          {allocations.map((alloc, idx) => (
            <div key={idx} className={relationRowClass}>
              <div className="min-w-0">
                <label className="text-xs font-medium text-muted-foreground">Process</label>
                <select
                  value={alloc.processId}
                  onChange={(e) =>
                    setAllocations(
                      allocations.map((a, i) =>
                        i === idx ? { ...a, processId: e.target.value } : a
                      )
                    )
                  }
                  className={selectClass}
                >
                  {processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="text-xs font-medium text-muted-foreground">Resource</label>
                <select
                  value={alloc.resourceId}
                  onChange={(e) =>
                    setAllocations(
                      allocations.map((a, i) =>
                        i === idx ? { ...a, resourceId: e.target.value } : a
                      )
                    )
                  }
                  className={selectClass}
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-[84px]">
                <label className="text-xs font-medium text-muted-foreground">Qty</label>
                <Input
                  type="number"
                  value={alloc.quantity}
                  onChange={(e) =>
                    setAllocations(
                      allocations.map((a, i) =>
                        i === idx
                          ? { ...a, quantity: Math.max(1, Number.isNaN(parseInt(e.target.value, 10)) ? 1 : parseInt(e.target.value, 10)) }
                          : a
                      )
                    )
                  }
                  min="1"
                  className="text-center font-medium bg-background pr-2"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeAllocation(idx)}
                className="w-9 px-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Requests */}
      <Card className={sectionCardClass}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold sm:text-lg">Requests</h3>
            <p className="text-xs text-muted-foreground">Resources each process is waiting for.</p>
          </div>
          <Button size="sm" onClick={addRequest} className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Request
          </Button>
        </div>

        <div className="space-y-3">
          {requests.map((req, idx) => (
            <div key={idx} className={relationRowClass}>
              <div className="min-w-0">
                <label className="text-xs font-medium text-muted-foreground">Process</label>
                <select
                  value={req.processId}
                  onChange={(e) =>
                    setRequests(
                      requests.map((r, i) =>
                        i === idx ? { ...r, processId: e.target.value } : r
                      )
                    )
                  }
                  className={selectClass}
                >
                  {processes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="text-xs font-medium text-muted-foreground">Resource</label>
                <select
                  value={req.resourceId}
                  onChange={(e) =>
                    setRequests(
                      requests.map((r, i) =>
                        i === idx ? { ...r, resourceId: e.target.value } : r
                      )
                    )
                  }
                  className={selectClass}
                >
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-[84px]">
                <label className="text-xs font-medium text-muted-foreground">Qty</label>
                <Input
                  type="number"
                  value={req.quantity}
                  onChange={(e) =>
                    setRequests(
                      requests.map((r, i) =>
                        i === idx
                          ? { ...r, quantity: Math.max(1, Number.isNaN(parseInt(e.target.value, 10)) ? 1 : parseInt(e.target.value, 10)) }
                          : r
                      )
                    )
                  }
                  min="1"
                  className="text-center font-medium bg-background pr-2"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeRequest(idx)}
                className="w-9 px-0"
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
        className="w-full h-11 text-sm font-semibold shadow-sm"
        size="lg"
      >
        {loading ? 'Analyzing...' : 'Analyze for Deadlock'}
      </Button>
    </div>
  );
}
