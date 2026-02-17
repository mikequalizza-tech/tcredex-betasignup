import { NextRequest, NextResponse } from 'next/server';
import { deleteDocument } from '@/lib/knowledge';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await deleteDocument(id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete source:', error);
    return NextResponse.json(
      { error: 'Failed to delete source' },
      { status: 500 }
    );
  }
}
