import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET(
    _request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const db = await getDb();
        const docWords = await db.collection('document_words').findOne({ document_id: params.id });

        if (!docWords) {
            return NextResponse.json({ error: 'Words not found' }, { status: 404 });
        }

        return NextResponse.json(docWords);
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
