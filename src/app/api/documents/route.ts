import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
    try {
        const db = await getDb();
        const documents = await db.collection('documents')
            .find({})
            .project({ content: 0 }) // Exclude big content field for listing
            .sort({ created_at: -1 })
            .toArray();

        return NextResponse.json(documents);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
