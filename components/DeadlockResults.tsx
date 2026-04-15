'use client';

import { AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { DeadlockAnalysis, ResolutionStrategy } from '@/lib/algorithms';
import { DeadlockGraph } from './DeadlockGraph';

interface DeadlockResultsProps {
  analysis: DeadlockAnalysis;
  resolutions: ResolutionStrategy[];
}

export function DeadlockResults({ analysis, resolutions }: DeadlockResultsProps) {
  return (
    <div className="space-y-6">

      {/* 🔥 GRAPH VISUALIZATION (ADDED HERE) */}
      <Card className="p-4 border border-border shadow-sm rounded-xl">
        <h3 className="text-lg font-semibold mb-4">System Graph</h3>
        <DeadlockGraph analysis={analysis} />
      </Card>

      {/* Status Alert */}
      {analysis.hasDeadlock ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Deadlock Detected!</strong> {analysis.explanation}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>No Deadlock Detected.</strong> {analysis.explanation}
          </AlertDescription>
        </Alert>
      )}

      {/* Deadlock Details */}
      {analysis.hasDeadlock && (
        <>
          <Card className="p-6 border border-border shadow-sm rounded-xl">
            <h3 className="text-lg font-semibold mb-4">Deadlock Cycles</h3>

            <div className="space-y-4">
              {analysis.cycleDetails.map((detail, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-muted rounded-lg border border-border"
                >
                  <p className="font-mono text-sm font-semibold mb-2">
                    Cycle {idx + 1}:
                  </p>

                  <p className="text-sm">
                    {detail.cycle.join(' → ')}
                  </p>

                  {detail.resources.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Resources involved: {detail.resources.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Resolution Strategies */}
          <Card className="p-6 border border-border shadow-sm rounded-xl">
            <h3 className="text-lg font-semibold mb-4">
              Resolution Strategies
            </h3>

            <div className="space-y-4">
              {resolutions.map((strategy, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h4 className="font-semibold capitalize mb-1">
                        {strategy.type}: {strategy.description}
                      </h4>

                      <p className="text-sm text-muted-foreground mb-3">
                        {strategy.explanation}
                      </p>

                      <div className="flex gap-4 text-xs">
                        <span className="text-muted-foreground">
                          Cost: {strategy.cost}/10
                        </span>

                        {strategy.affectedProcesses.length > 0 && (
                          <span className="text-muted-foreground">
                            Affects: {strategy.affectedProcesses.length} process(es)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Score box */}
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center font-semibold text-sm"
                      style={{
                        backgroundColor: `rgba(239, 68, 68, ${(11 - strategy.cost) / 11})`,
                        color: strategy.cost > 5 ? 'white' : 'inherit',
                      }}
                    >
                      {11 - strategy.cost}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}