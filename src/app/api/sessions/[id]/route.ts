import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const db = await getDb();

        const updateData = {
            ...body,
            last_updated: new Date().toISOString(),
        };

        // Remove ID if present in body to avoid MongoDB error
        delete updateData.id;
        delete updateData._id;

        await db.collection('reading_sessions').updateOne(
            { id: params.id },
            { $set: updateData }
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
