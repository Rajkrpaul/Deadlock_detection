import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verify ownership before deleting
    const { data: scenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    if (scenario.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Delete the scenario
    const { error: deleteError } = await supabase
      .from('scenarios')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ message: 'Scenario deleted' });
  } catch (error) {
    console.error('Delete scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to delete scenario' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Fetch the scenario with ownership check
    const { data, error } = await supabase
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ scenario: data });
  } catch (error) {
    console.error('Get scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch scenario' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { name, description, data: scenarioData } = await request.json();

    // Verify ownership
    const { data: scenario, error: fetchError } = await supabase
      .from('scenarios')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError || !scenario) {
      return NextResponse.json(
        { error: 'Scenario not found' },
        { status: 404 }
      );
    }

    if (scenario.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Update the scenario
    const { data: updated, error: updateError } = await supabase
      .from('scenarios')
      .update({
        name,
        description,
        data: scenarioData,
      })
      .eq('id', id)
      .select();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ scenario: updated[0] });
  } catch (error) {
    console.error('Update scenario error:', error);
    return NextResponse.json(
      { error: 'Failed to update scenario' },
      { status: 500 }
    );
  }
}
