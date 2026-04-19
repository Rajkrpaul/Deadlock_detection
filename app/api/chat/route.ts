import { NextRequest, NextResponse } from 'next/server';
import { analyzeDeadlock, chatWithAssistant, type DeadlockContext } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let parsedBody: {
      message?: string;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      deadlockContext?: DeadlockContext | null;
    };

    try {
      parsedBody = JSON.parse(rawBody);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Invalid JSON body',
          details: parseError instanceof Error ? parseError.message : 'Unknown parse error',
        },
        { status: 400 }
      );
    }

    const { message, conversationHistory, deadlockContext } = parsedBody;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    let response: string;

    // If deadlock context is provided, use the specialized analyzer
    if (deadlockContext) {
      response = await analyzeDeadlock(
        deadlockContext as DeadlockContext,
        message,
        conversationHistory || []
      );
    } else {
      // Otherwise, use the general chat assistant
      response = await chatWithAssistant(message, conversationHistory || []);
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      process.env.NODE_ENV === 'development'
        ? {
            error: 'Failed to process chat request',
            details: error instanceof Error ? error.message : 'Unknown error',
          }
        : { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
