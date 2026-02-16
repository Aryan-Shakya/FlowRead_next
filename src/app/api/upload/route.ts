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

        let text = '';
        let fileName = '';
        let fileExtension = '';

        // Check if this is a text paste or file upload
        if (formData.has('text')) {
            // Direct text input
            text = formData.get('text') as string;
            const timestamp = new Date().toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
            fileName = `Pasted Text - ${timestamp}`;
            fileExtension = 'txt';
        } else {
            // File upload
            const file = formData.get('file') as File;

            if (!file) {
                return NextResponse.json({ error: 'No file or text provided' }, { status: 400 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            fileName = file.name;
            fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

            if (fileExtension === 'pdf') {
                // PDF support temporarily disabled due to deployment constraints
                return NextResponse.json({
                    error: 'PDF uploads are temporarily unavailable. Please use DOCX or TXT files.'
                }, { status: 400 });
            } else if (fileExtension === 'docx') {
                const result = await mammoth.extractRawText({ buffer });
                text = result.value;
            } else {
                text = buffer.toString('utf-8');
            }
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
