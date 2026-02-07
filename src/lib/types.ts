export interface Document {
    id: string;
    title: string;
    content: string;
    word_count: number;
    file_type: string;
    created_at: string;
}

export interface ProcessedWord {
    word: string;
    syllables: string[];
    vowels: number[][]; // indices of vowels in each syllable
}

export interface ReadingSession {
    id: string;
    document_id: string;
    current_word_index: number;
    total_words: number;
    words_read: number;
    time_spent: number;
    speed_wpm: number;
    last_updated: string;
    completed: boolean;
}
