import { NextRequest, NextResponse } from 'next/server';
import { listDocuments } from '@/lib/knowledge/vectorStore';
import { KnowledgeCategory } from '@/lib/knowledge/types';

export async function GET(req: NextRequest) {
  try {
    const category = req.nextUrl.searchParams.get('category') as KnowledgeCategory | null;
    
    const sources = await listDocuments(category || undefined);
    
    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Failed to get sources:', error);
    
    // Return empty array if Supabase not configured yet
    return NextResponse.json({ sources: [] });
  }
}
