import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = await getDb();
        // Get the most recent session for this document
        const session = await db.collection('reading_sessions')
            .findOne({ document_id: params.id }, { sort: { last_updated: -1 } });

        return NextResponse.json(session || null);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
