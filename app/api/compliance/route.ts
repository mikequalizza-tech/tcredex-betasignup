import { NextResponse } from 'next/server';

// Compliance check placeholder — SAM.gov integration intentionally disabled.
export async function POST(req: Request) {
  try {
    const { entityName, ein } = await req.json();

    if (!entityName) {
      return NextResponse.json(
        { error: 'Entity name is required' },
        { status: 400 }
      );
    }

    // Return a deterministic stub; no external calls are made.
    const result = {
      entityName,
      ein: ein || null,
      checked: true,
      debarred: false,
      checkedAt: new Date().toISOString(),
      source: 'disabled',
      message: 'SAM.gov check disabled; manual review required.',
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Debarment check error:', error);
    return NextResponse.json(
      { error: 'Failed to perform compliance check' },
      { status: 500 }
    );
  }
}
