import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';
import { v4 as uuidv4 } from 'uuid';
import mammoth from 'mammoth';
import { processTextToWords } from '@/lib/syllables';

// Configure route for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for file processing

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        let text = '';
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop()?.toLowerCase();

        if (fileExtension === 'pdf') {
            // Dynamic import for pdf-parse (CommonJS module with complex interop)
            const pdfParseModule = await import('pdf-parse');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pdfParse = (pdfParseModule as any).default || pdfParseModule;
            const data = await pdfParse(buffer);
            text = data.text;
        } else if (fileExtension === 'docx') {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
        } else {
            text = buffer.toString('utf-8');
        }

        const words = processTextToWords(text);
        const documentId = uuidv4();
        const timestamp = new Date().toISOString();

        const db = await getDb();

        // Store document metadata
        await db.collection('documents').insertOne({
            id: documentId,
            title: fileName,
            file_type: fileExtension,
            word_count: words.length,
            created_at: timestamp,
        });

        // Store processed words in a separate collection to keep document metadata light
        await db.collection('document_words').insertOne({
            document_id: documentId,
            words: words,
        });

        return NextResponse.json({ id: documentId, title: fileName });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
