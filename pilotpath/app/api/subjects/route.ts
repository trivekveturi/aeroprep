// GET /api/subjects — list all subjects
import { NextResponse } from 'next/server';
import { getDataSource } from '@/lib/datasource';

export async function GET() {
  try {
    const ds = getDataSource();
    const subjects = await ds.listSubjects();
    return NextResponse.json(subjects);
  } catch (err) {
    console.error('GET /api/subjects error:', err);
    return NextResponse.json({ error: 'Failed to load subjects' }, { status: 500 });
  }
}
