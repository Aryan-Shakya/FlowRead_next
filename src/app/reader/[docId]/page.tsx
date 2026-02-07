"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
    Play,
    Pause,
    SkipBack,
    SkipForward,
    Settings,
    ArrowLeft,
    Moon,
    Sun,
    Bookmark,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/components/ThemeProvider';
import { motion, AnimatePresence } from 'framer-motion';
interface ProcessedWord {
    text: string;
    syllables: string[];
    vowels: number[][];
}

interface Document {
    id: string;
    title: string;
    file_type: string;
    word_count: number;
    created_at: string;
}

const COLOR_PRESETS: Record<string, { name: string; vowel: string; consonant: string }> = {
    montessori: {
        name: 'Montessori',
        vowel: '#3B82F6',
        consonant: '#EF4444',
    },
    bionic: {
        name: 'Bionic Reading',
        vowel: '#8B5CF6',
        consonant: '#000000',
    },
    highContrast: {
        name: 'High Contrast',
        vowel: '#10B981',
        consonant: '#1F2937',
    },
    ocean: {
        name: 'Ocean',
        vowel: '#06B6D4',
        consonant: '#0E7490',
    },
};

const FONT_OPTIONS = [
    { name: 'Modern Sans', value: 'inter' },
    { name: 'Classic Serif', value: 'merriweather' },
    { name: 'Code Mono', value: 'jetbrains' },
];

export default function Reader({ params }: { params: { docId: string } }) {
    const { docId } = params;
    const router = useRouter();
    const { theme, setTheme } = useTheme();

    const [document, setDocument] = useState<Document | null>(null);
    const [words, setWords] = useState<ProcessedWord[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(200);
    const [fontSize, setFontSize] = useState(80);
    const [fontFamily, setFontFamily] = useState('inter');
    const [colorPreset, setColorPreset] = useState('montessori');
    const [customVowelColor] = useState('#3B82F6');
    const [customConsonantColor] = useState('#EF4444');
    const [useCustomColors, setUseCustomColors] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [bookmark, setBookmark] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        wordsRead: 0,
        timeSpent: 0,
        startTime: null as number | null,
    });

    const wordsRef = useRef<ProcessedWord[]>([]);
    const currentIndexRef = useRef(0);
    const sessionIdRef = useRef<string | null>(null);
    const statsRef = useRef({
        wordsRead: 0,
        timeSpent: 0,
        startTime: null as number | null,
    });
    const speedRef = useRef(200);
    const hasCheckedSession = useRef(false);

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const lastUpdateRef = useRef(Date.now());

    const fetchDocument = useCallback(async () => {
        try {
            const response = await axios.get(`/api/documents/${docId}`);
            setDocument(response.data);
        } catch (error) {
            console.error('Error fetching document:', error);
            toast.error('Document not found');
            router.push('/library');
        }
    }, [docId, router]);

    const fetchWords = useCallback(async () => {
        try {
            const response = await axios.get(`/api/documents/${docId}/words`);
            setWords(response.data.words);
        } catch (error) {
            console.error('Error fetching words:', error);
            toast.error('Failed to load document content');
        }
    }, [docId]);

    const createNewSession = useCallback(async () => {
        try {
            const response = await axios.post(`/api/sessions`, {
                document_id: docId,
                current_word_index: 0,
                total_words: wordsRef.current.length || 0,
                words_read: 0,
                time_spent: 0,
                speed_wpm: speedRef.current,
                completed: false,
            });
            setSessionId(response.data.id);
            setStats((prev) => ({ ...prev, startTime: Date.now() }));
        } catch (error) {
            console.error('Error creating session:', error);
        }
    }, [docId]);

    const checkExistingSession = useCallback(async () => {
        try {
            const response = await axios.get(`/api/sessions/document/${docId}`);
            if (response.data) {
                setSessionId(response.data.id);
                setCurrentIndex(response.data.current_word_index);
                setSpeed(response.data.speed_wpm);
                toast.success('Resumed from last session');
            } else {
                createNewSession();
            }
        } catch {
            createNewSession();
        }
    }, [docId, createNewSession]);

    const updateSession = useCallback(async () => {
        if (!sessionIdRef.current) return;

        try {
            await axios.put(`/api/sessions/${sessionIdRef.current}`, {
                current_word_index: currentIndexRef.current,
                words_read: statsRef.current.wordsRead,
                time_spent: Math.floor(statsRef.current.timeSpent),
                speed_wpm: speedRef.current,
                completed: false,
            });
        } catch (error) {
            console.error('Error updating session:', error);
        }
    }, []);

    const completeSession = useCallback(async () => {
        if (!sessionIdRef.current) return;

        try {
            await axios.put(`/api/sessions/${sessionIdRef.current}`, {
                current_word_index: currentIndexRef.current,
                words_read: statsRef.current.wordsRead,
                time_spent: Math.floor(statsRef.current.timeSpent),
                speed_wpm: speedRef.current,
                completed: true,
            });
            toast.success('Reading session completed! 🎉');
        } catch (error) {
            console.error('Error completing session:', error);
        }
    }, []);

    const togglePlayPause = useCallback(() => {
        if (!isPlaying && stats.startTime === null) {
            setStats((prev) => ({ ...prev, startTime: Date.now() }));
        }
        setIsPlaying(!isPlaying);
    }, [isPlaying, stats.startTime]);

    const skipForward = useCallback(() => {
        setCurrentIndex((prev) => Math.min(words.length - 1, prev + 1));
    }, [words.length]);

    const skipBackward = useCallback(() => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    }, []);

    // Initial data fetch
    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchDocument(), fetchWords()]);
            setLoading(false);
        };
        init();
        hasCheckedSession.current = false;
    }, [docId, fetchDocument, fetchWords]);

    // Session check
    useEffect(() => {
        if (words.length > 0 && !hasCheckedSession.current) {
            hasCheckedSession.current = true;
            checkExistingSession();
        }
    }, [words.length, checkExistingSession]);

    // Sync refs
    useEffect(() => {
        wordsRef.current = words;
        currentIndexRef.current = currentIndex;
        sessionIdRef.current = sessionId;
        statsRef.current = stats;
        speedRef.current = speed;
    }, [words, currentIndex, sessionId, stats, speed]);

    // Playback
    useEffect(() => {
        if (isPlaying) {
            const interval = 60000 / speed;
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= wordsRef.current.length - 1) {
                        setIsPlaying(false);
                        completeSession();
                        return prev;
                    }
                    return prev + 1;
                });

                setStats((prev) => {
                    const newStats = {
                        ...prev,
                        wordsRead: prev.wordsRead + 1,
                        timeSpent: prev.timeSpent + (Date.now() - lastUpdateRef.current) / 1000,
                    };
                    return newStats;
                });
                lastUpdateRef.current = Date.now();
            }, interval);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isPlaying, speed, completeSession]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlayPause();
            } else if (e.code === 'ArrowRight') {
                e.preventDefault();
                skipForward();
            } else if (e.code === 'ArrowLeft') {
                e.preventDefault();
                skipBackward();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [togglePlayPause, skipForward, skipBackward]);

    const renderWord = () => {
        if (!words[currentIndex]) return null;

        const wordData = words[currentIndex];
        const colors = useCustomColors
            ? { vowel: customVowelColor, consonant: customConsonantColor }
            : COLOR_PRESETS[colorPreset];

        return (
            <div className="flex flex-wrap justify-center items-center gap-1">
                {wordData.syllables.map((syllable: string, sylIndex: number) => (
                    <span key={sylIndex} className="inline-flex">
                        {syllable.split('').map((char: string, charIndex: number) => {
                            const isVowelChar = wordData.vowels[sylIndex]?.includes(charIndex);
                            const color = isVowelChar ? colors.vowel : colors.consonant;
                            return (
                                <span
                                    key={charIndex}
                                    style={{
                                        color: theme === 'dark' && color === '#000000' ? '#ffffff' : color,
                                    }}
                                >
                                    {char}
                                </span>
                            );
                        })}
                    </span>
                ))}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full mb-4"
                />
                <p className="text-xl font-manrope font-semibold mb-2 text-center text-primary">Loading Reader...</p>
            </div>
        );
    }

    const progress = words.length > 0 ? (currentIndex / words.length) * 100 : 0;

    return (
        <div className={`min-h-screen bg-background flex flex-col font-${fontFamily}`}>
            {/* Header */}
            <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            updateSession();
                            router.push('/library');
                        }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="font-semibold">{document?.title}</h1>
                        <p className="text-xs text-muted-foreground">
                            {currentIndex + 1} / {words.length} words
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>

                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon">
                                <Settings className="w-5 h-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle>Reader Settings</SheetTitle>
                            </SheetHeader>

                            <div className="space-y-6 mt-6">
                                <div className="space-y-2">
                                    <Label>Font Family</Label>
                                    <Select value={fontFamily} onValueChange={setFontFamily}>
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {FONT_OPTIONS.map((font) => (
                                                <SelectItem key={font.value} value={font.value}>{font.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Font Size: {fontSize}px</Label>
                                    <Slider
                                        value={[fontSize]}
                                        onValueChange={([value]: number[]) => setFontSize(value)}
                                        min={40}
                                        max={150}
                                        step={10}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Color Pattern</Label>
                                    <Select
                                        value={useCustomColors ? 'custom' : colorPreset}
                                        onValueChange={(value: string) => {
                                            if (value === 'custom') setUseCustomColors(true);
                                            else {
                                                setUseCustomColors(false);
                                                setColorPreset(value);
                                            }
                                        }}
                                    >
                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
                                                <SelectItem key={key} value={key}>{preset.name}</SelectItem>
                                            ))}
                                            <SelectItem value="custom">Custom Colors</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </header>

            {/* Main Reader */}
            <div className="flex-1 flex items-center justify-center px-6 py-12">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.05 }}
                        className="font-bold tracking-tight text-center"
                        style={{ fontSize: `${fontSize}px` }}
                    >
                        {renderWord()}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-muted">
                <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Controls */}
            <div className="border-t border-border px-6 py-4 bg-card">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={skipBackward} disabled={currentIndex === 0}>
                                <SkipBack className="w-5 h-5" />
                            </Button>

                            <Button size="icon" className="w-14 h-14 rounded-full" onClick={togglePlayPause}>
                                {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                            </Button>

                            <Button variant="outline" size="icon" onClick={skipForward} disabled={currentIndex >= words.length - 1}>
                                <SkipForward className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="text-center">
                            <div className="text-3xl font-bold text-primary">{speed}</div>
                            <div className="text-xs text-muted-foreground uppercase tracking-wider">WPM</div>
                        </div>

                        <Button variant="outline" onClick={() => {
                            if (bookmark !== null) setCurrentIndex(bookmark);
                            else setBookmark(currentIndex);
                        }}>
                            <Bookmark className="w-4 h-4 mr-2" />
                            {bookmark !== null ? 'Resume Bookmark' : 'Save Bookmark'}
                        </Button>
                    </div>

                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Reading Speed</Label>
                        <Slider value={[speed]} onValueChange={([v]: number[]) => setSpeed(v)} min={50} max={1000} step={10} />
                    </div>
                </div>
            </div>
        </div>
    );
}
