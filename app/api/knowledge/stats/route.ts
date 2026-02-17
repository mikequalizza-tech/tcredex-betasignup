import { NextResponse } from 'next/server';
import { getKnowledgeStats } from '@/lib/knowledge/vectorStore';

export async function GET() {
  try {
    const stats = await getKnowledgeStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get stats:', error);
    
    // Return default stats if Supabase not configured
    return NextResponse.json({
      totalSources: 0,
      totalChunks: 0,
      byCategory: {},
    });
  }
}
