import { NextResponse } from 'next/server';
import { getDb } from '@/lib/mongodb';

export async function GET() {
    try {
        const db = await getDb();

        // Total documents
        const totalDocuments = await db.collection('documents').countDocuments();

        // Aggregated stats from sessions
        const sessionStats = await db.collection('reading_sessions').aggregate([
            {
                $group: {
                    _id: null,
                    totalWordsRead: { $sum: "$words_read" },
                    totalTimeSpent: { $sum: "$time_spent" },
                    completedDocs: { $sum: { $cond: ["$completed", 1, 0] } },
                    avgSpeed: { $avg: "$speed_wpm" }
                }
            }
        ]).toArray();

        const stats = sessionStats[0] || {
            totalWordsRead: 0,
            totalTimeSpent: 0,
            completedDocs: 0,
            avgSpeed: 0
        };

        return NextResponse.json({
            total_documents: totalDocuments,
            total_words_read: stats.totalWordsRead,
            total_time_spent: stats.totalTimeSpent,
            average_speed: Math.round(stats.avgSpeed || 0),
            documents_completed: stats.completedDocs
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
}
