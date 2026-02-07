import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const db = await getDb();

        const session = {
            ...body,
            id: uuidv4(),
            last_updated: new Date().toISOString(),
            created_at: new Date().toISOString(),
        };

        await db.collection('reading_sessions').insertOne(session);

        return NextResponse.json(session);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
