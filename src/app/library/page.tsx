"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText, Trash2, Calendar, BookOpen, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
interface Document {
    id: string;
    title: string;
    created_at: string;
    word_count: number;
    file_type: string;
}

interface Stats {
    total_documents: number;
    total_words_read: number;
    total_time_spent: number;
    average_speed: number;
    documents_completed: number;
}

export default function Library() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDocuments();
        fetchStats();
    }, []);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get('/api/documents');
            setDocuments(response.data);
        } catch (error) {
            console.error('Error fetching documents:', error);
            toast.error('Failed to load documents');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/stats');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const deleteDocument = async (docId: string) => {
        try {
            await axios.delete(`/api/documents/${docId}`);
            toast.success('Document deleted');
            fetchDocuments();
            fetchStats();
        } catch (error) {
            console.error('Error deleting document:', error);
            toast.error('Failed to delete document');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m`;
        return `${seconds}s`;
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center gap-4">
                        <Button
                            data-testid="back-to-home-button"
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push('/')}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="text-2xl font-manrope font-bold">Your Library</h1>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-6 py-8">
                {/* Stats Cards */}
                {stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
                    >
                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BookOpen className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Documents</p>
                                    <p className="text-2xl font-bold">{stats.total_documents}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Words Read</p>
                                    <p className="text-2xl font-bold">{stats.total_words_read?.toLocaleString() || 0}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Time Spent</p>
                                    <p className="text-2xl font-bold">{formatTime(stats.total_time_spent)}</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg Speed</p>
                                    <p className="text-2xl font-bold">{stats.average_speed} WPM</p>
                                </div>
                            </div>
                        </Card>

                        <Card className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold">{stats.documents_completed}</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Documents List */}
                <div>
                    <h2 className="text-xl font-manrope font-semibold mb-4">Your Documents</h2>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mb-4"></div>
                            <p className="text-lg font-medium">Fetching your library...</p>
                            <p className="text-sm text-muted-foreground max-w-xs mt-2">
                                Scanning your persistent storage 🚀
                            </p>
                        </div>
                    ) : documents.length === 0 ? (
                        <Card className="p-12 text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-lg font-semibold mb-2">No documents yet</h3>
                            <p className="text-muted-foreground mb-4">Upload your first document to start reading</p>
                            <Button data-testid="go-to-upload-button" onClick={() => router.push('/')}>Upload Document</Button>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {documents.map((doc, index) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card className="p-6 hover:shadow-lg transition-shadow">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <FileText className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg mb-1">{doc.title}</h3>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4" />
                                                            {formatDate(doc.created_at)}
                                                        </span>
                                                        <span>{doc.word_count.toLocaleString()} words</span>
                                                        <span className="uppercase text-xs font-medium">{doc.file_type}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    data-testid={`read-document-${doc.id}-button`}
                                                    onClick={() => router.push(`/reader/${doc.id}`)}
                                                >
                                                    Read
                                                </Button>
                                                <Button
                                                    data-testid={`delete-document-${doc.id}-button`}
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => deleteDocument(doc.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
