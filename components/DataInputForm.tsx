'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus, Settings, Cpu, HardDrive, ArrowRightLeft, Clock, BarChart2, ChevronDown } from 'lucide-react';
import type {
  Process,
  Resource,
  Allocation,
  Request as DeadlockRequest,
} from '@/lib/algorithms';

interface DataInputFormProps {
  onAnalyze: (
    processes: Process[],
    resources: Resource[],
    allocations: Allocation[],
    requests: DeadlockRequest[]
  ) => void;
  loading?: boolean;
}

/* Color dots for processes and resources */
const P_COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const R_COLORS = ['#22c55e', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

/* Shared select className */
const sel =
  'h-8 w-full rounded-md border border-input bg-background px-2 text-xs text-foreground outline-none transition-colors focus:border-ring';

/* Section wrapper */
function Section({
  icon,
  title,
  subtitle,
  addLabel,
  onAdd,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  addLabel: string;
  onAdd: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2.5">
      {/* Section header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-primary/10 text-primary">{icon}</span>
          <div>
            <p className="text-xs font-semibold leading-tight">{title}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{subtitle}</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAdd}
          className="h-7 px-2.5 text-[11px] font-medium gap-1 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary shrink-0"
        >
          <Plus className="w-3 h-3" />
          {addLabel}
        </Button>
      </div>
      {children}
    </div>
  );
}

/* Action icon button (pencil or trash) */
function ActionBtn({
  onClick,
  variant = 'edit',
}: {
  onClick: () => void;
  variant?: 'edit' | 'delete';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-6 h-6 flex items-center justify-center rounded transition-colors ${
        variant === 'delete'
          ? 'text-muted-foreground hover:text-red-500'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {variant === 'delete' ? (
        <Trash2 className="w-3.5 h-3.5" />
      ) : (
        <Pencil className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

/* Column header row */
function ColHead({ cols, style }: { cols: string[]; style: React.CSSProperties }) {
  return (
    <div className="grid items-center px-0.5" style={style}>
      {cols.map((c, i) => (
        <span key={i} className="text-[10px] font-medium text-muted-foreground">
          {c}
        </span>
      ))}
    </div>
  );
}

export function DataInputForm({ onAnalyze, loading = false }: DataInputFormProps) {
  const [processes, setProcesses] = useState<Process[]>([
    { id: 'P1', name: 'Process 1', priority: 0, status: 'running' },
    { id: 'P2', name: 'Process 2', priority: 0, status: 'running' },
  ]);
  const [resources, setResources] = useState<Resource[]>([
    { id: 'R1', name: 'Resource 1', instances: 1 },
    { id: 'R2', name: 'Resource 2', instances: 1 },
  ]);
  const [allocations, setAllocations] = useState<Allocation[]>([
    { processId: 'P1', resourceId: 'R1', quantity: 1 },
    { processId: 'P2', resourceId: 'R2', quantity: 1 },
  ]);
  const [requests, setRequests] = useState<DeadlockRequest[]>([
    { processId: 'P1', resourceId: 'R2', quantity: 1 },
    { processId: 'P2', resourceId: 'R1', quantity: 1 },
  ]);

  /* ── Helpers ── */
  const addProcess = () => {
    const n = processes.length + 1;
    setProcesses([...processes, { id: `P${n}`, name: `Process ${n}`, priority: 0, status: 'running' }]);
  };
  const removeProcess = (id: string) => {
    setProcesses(p => p.filter(x => x.id !== id));
    setAllocations(a => a.filter(x => x.processId !== id));
    setRequests(r => r.filter(x => x.processId !== id));
  };

  const addResource = () => {
    const n = resources.length + 1;
    setResources([...resources, { id: `R${n}`, name: `Resource ${n}`, instances: 1 }]);
  };
  const removeResource = (id: string) => {
    setResources(r => r.filter(x => x.id !== id));
    setAllocations(a => a.filter(x => x.resourceId !== id));
    setRequests(r => r.filter(x => x.resourceId !== id));
  };

  const addAllocation = () => {
    if (processes.length > 0 && resources.length > 0)
      setAllocations([...allocations, { processId: processes[0].id, resourceId: resources[0].id, quantity: 1 }]);
  };
  const removeAllocation = (idx: number) => setAllocations(a => a.filter((_, i) => i !== idx));

  const addRequest = () => {
    if (processes.length > 0 && resources.length > 0)
      setRequests([...requests, { processId: processes[0].id, resourceId: resources[0].id, quantity: 1 }]);
  };
  const removeRequest = (idx: number) => setRequests(r => r.filter((_, i) => i !== idx));

  /* ── Process / Resource grid: [1fr  60px  24px  24px] ── */
  const pRowGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 60px 24px 24px', gap: '6px', alignItems: 'center' };
  /* ── Alloc / Request grid:  [1fr  1fr  52px  24px  24px] ── */
  const rRowGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr 52px 24px 24px', gap: '6px', alignItems: 'center' };

  return (
    <div className="space-y-5">

        {/* ── PROCESSES ─────────────────────────────── */}
        <Section
          icon={<Cpu className="w-3.5 h-3.5" />}
          title="Processes"
          subtitle="Define runnable units and priority order."
          addLabel="+ Add Process"
          onAdd={addProcess}
        >
          {processes.length > 0 && (
            <>
              <ColHead
                cols={['Name', 'Priority', '', '']}
                style={pRowGrid}
              />
              <div className="space-y-1.5">
                {processes.map((proc, pi) => (
                  <div key={proc.id} style={pRowGrid}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: P_COLORS[pi % P_COLORS.length] }} />
                      <Input
                        value={proc.name}
                        onChange={e => setProcesses(ps => ps.map(p => p.id === proc.id ? { ...p, name: e.target.value } : p))}
                        className="h-8 text-xs min-w-0"
                      />
                    </div>
                    <Input
                      type="number"
                      value={proc.priority}
                      onChange={e => setProcesses(ps => ps.map(p => p.id === proc.id ? { ...p, priority: isNaN(+e.target.value) ? 0 : +e.target.value } : p))}
                      className="h-8 text-xs text-center px-1"
                    />
                    <ActionBtn onClick={() => {}} variant="edit" />
                    <ActionBtn onClick={() => removeProcess(proc.id)} variant="delete" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        <div className="border-t border-border/50" />

        {/* ── RESOURCES ─────────────────────────────── */}
        <Section
          icon={<HardDrive className="w-3.5 h-3.5" />}
          title="Resources"
          subtitle="Define shared resource pools and capacity."
          addLabel="+ Add Resource"
          onAdd={addResource}
        >
          {resources.length > 0 && (
            <>
              <ColHead
                cols={['Name', 'Instances', '', '']}
                style={pRowGrid}
              />
              <div className="space-y-1.5">
                {resources.map((res, ri) => (
                  <div key={res.id} style={pRowGrid}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: R_COLORS[ri % R_COLORS.length] }} />
                      <Input
                        value={res.name}
                        onChange={e => setResources(rs => rs.map(r => r.id === res.id ? { ...r, name: e.target.value } : r))}
                        className="h-8 text-xs min-w-0"
                      />
                    </div>
                    <Input
                      type="number"
                      value={res.instances}
                      onChange={e => setResources(rs => rs.map(r => r.id === res.id ? { ...r, instances: Math.max(1, isNaN(+e.target.value) ? 1 : +e.target.value) } : r))}
                      className="h-8 text-xs text-center px-1"
                    />
                    <ActionBtn onClick={() => {}} variant="edit" />
                    <ActionBtn onClick={() => removeResource(res.id)} variant="delete" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        <div className="border-t border-border/50" />

        {/* ── ALLOCATIONS ───────────────────────────── */}
        <Section
          icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
          title="Allocations"
          subtitle="Resources currently held by each process."
          addLabel="+ Add Allocation"
          onAdd={addAllocation}
        >
          {allocations.length > 0 && (
            <>
              <ColHead
                cols={['Process', 'Resource', 'Quantity', '', '']}
                style={rRowGrid}
              />
              <div className="space-y-1.5">
                {allocations.map((alloc, idx) => (
                  <div key={idx} style={rRowGrid}>
                    <select
                      value={alloc.processId}
                      onChange={e => setAllocations(a => a.map((x, i) => i === idx ? { ...x, processId: e.target.value } : x))}
                      className={sel}
                    >
                      {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select
                      value={alloc.resourceId}
                      onChange={e => setAllocations(a => a.map((x, i) => i === idx ? { ...x, resourceId: e.target.value } : x))}
                      className={sel}
                    >
                      {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <Input
                      type="number"
                      value={alloc.quantity}
                      onChange={e => setAllocations(a => a.map((x, i) => i === idx ? { ...x, quantity: Math.max(1, isNaN(+e.target.value) ? 1 : +e.target.value) } : x))}
                      min="1"
                      className="h-8 text-xs text-center px-1"
                    />
                    <ActionBtn onClick={() => {}} variant="edit" />
                    <ActionBtn onClick={() => removeAllocation(idx)} variant="delete" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

        <div className="border-t border-border/50" />

        {/* ── REQUESTS ──────────────────────────────── */}
        <Section
          icon={<Clock className="w-3.5 h-3.5" />}
          title="Requests"
          subtitle="Resources each process is waiting for."
          addLabel="+ Add Request"
          onAdd={addRequest}
        >
          {requests.length > 0 && (
            <>
              <ColHead
                cols={['Process', 'Resource', 'Quantity', '', '']}
                style={rRowGrid}
              />
              <div className="space-y-1.5">
                {requests.map((req, idx) => (
                  <div key={idx} style={rRowGrid}>
                    <select
                      value={req.processId}
                      onChange={e => setRequests(r => r.map((x, i) => i === idx ? { ...x, processId: e.target.value } : x))}
                      className={sel}
                    >
                      {processes.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select
                      value={req.resourceId}
                      onChange={e => setRequests(r => r.map((x, i) => i === idx ? { ...x, resourceId: e.target.value } : x))}
                      className={sel}
                    >
                      {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    <Input
                      type="number"
                      value={req.quantity}
                      onChange={e => setRequests(r => r.map((x, i) => i === idx ? { ...x, quantity: Math.max(1, isNaN(+e.target.value) ? 1 : +e.target.value) } : x))}
                      min="1"
                      className="h-8 text-xs text-center px-1"
                    />
                    <ActionBtn onClick={() => {}} variant="edit" />
                    <ActionBtn onClick={() => removeRequest(idx)} variant="delete" />
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>

      {/* ── Analyze Button — pinned to bottom ── */}
      <div className="pt-4 border-t border-border/50 mt-4 shrink-0">
        <Button
          onClick={() => onAnalyze(processes, resources, allocations, requests)}
          disabled={loading}
          className="w-full h-10 text-sm font-semibold gap-2 bg-primary hover:bg-primary/90"
        >
          <BarChart2 className="w-4 h-4" />
          {loading ? 'Analyzing…' : 'Analyze for Deadlock'}
        </Button>
      </div>
    </div>
  );
}
