import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';
import { analyzeDeadlock, chatWithAssistant, type DeadlockContext } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { message, conversationHistory, deadlockContext } = await request.json();

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
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}
