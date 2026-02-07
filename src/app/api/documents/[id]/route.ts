import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = await getDb();
        const document = await db.collection('documents').findOne({ id: params.id });

        if (!document) {
            return NextResponse.json({ error: 'Document not found' }, { status: 404 });
        }

        return NextResponse.json(document);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = await getDb();

        // Delete document
        await db.collection('documents').deleteOne({ id: params.id });
        // Delete words
        await db.collection('document_words').deleteOne({ document_id: params.id });
        // Delete sessions
        await db.collection('reading_sessions').deleteMany({ document_id: params.id });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
