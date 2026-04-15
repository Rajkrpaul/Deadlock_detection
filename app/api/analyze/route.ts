import { NextRequest, NextResponse } from 'next/server';
import { detectDeadlock, getDeadlockResolutions } from '@/lib/algorithms';
import type {
  Process,
  Resource,
  Allocation,
  Request as DeadlockRequest,
} from '@/lib/algorithms';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      processes,
      resources,
      allocations = [],
      requests = [],
    } = body;

    // 🛡️ Validate input
    if (
      !processes ||
      !resources ||
      !Array.isArray(processes) ||
      !Array.isArray(resources)
    ) {
      return NextResponse.json(
        { error: 'Invalid input: processes and resources are required' },
        { status: 400 }
      );
    }

    // 🧠 Run deadlock detection
    const analysis = detectDeadlock(
      processes as Process[],
      resources as Resource[],
      allocations as Allocation[],
      requests as DeadlockRequest[]
    );

    // ⚙️ Generate resolutions if deadlock exists
    const resolutions = analysis.hasDeadlock
      ? getDeadlockResolutions(
          analysis,
          processes as Process[],
          resources as Resource[],
          allocations as Allocation[],
          requests as DeadlockRequest[]
        )
      : [];

    // 📊 ENRICHED RESPONSE (FOR VISUALIZATION)
    return NextResponse.json({
      analysis: {
        ...analysis,
        processes,
        resources,
        allocations,
        requests,
      },
      resolutions,
    });
  } catch (error) {
    console.error('Analyze API error:', error);

    return NextResponse.json(
      {
        error: 'Failed to analyze deadlock',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}