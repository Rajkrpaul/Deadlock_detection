import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's scenarios from Supabase
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({ scenarios: data });
  } catch (error) {
    console.error('Get scenarios error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenarios' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, description, data: scenarioData } = await request.json();

    if (!name || !scenarioData) {
      return NextResponse.json(
        { error: 'Name and data are required' },
        { status: 400 }
      );
    }

    // Insert scenario into Supabase
    const { data, error } = await supabase
      .from('scenarios')
      .insert({
        user_id: session.user.id,
        name,
        description,
        data: scenarioData,
      })
      .select();

    if (error) {
      throw error;
    }

    return NextResponse.json({ scenario: data[0] }, { status: 201 });
  } catch (error) {
    console.error('Create scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to create scenario' },
      { status: 500 }
    );
  }
}
