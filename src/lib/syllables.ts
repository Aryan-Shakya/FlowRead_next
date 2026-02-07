import Hypher from 'hypher';
import english from 'hyphenation.en-us';

const hypher = new Hypher(english);

export function detectSyllables(word: string): string[] {
    // Clean the word of punctuation for detection but keep it for display if needed
    // However, the original logic split by hyphen
    const syllables = hypher.hyphenate(word);
    return syllables.length > 0 ? syllables : [word];
}

export function isVowel(char: string): boolean {
    return 'aeiouAEIOU'.includes(char);
}

export function getVowelIndices(syllable: string): number[] {
    const indices: number[] = [];
    for (let i = 0; i < syllable.length; i++) {
        if (isVowel(syllable[i])) {
            indices.push(i);
        }
    }
    return indices;
}

export interface ProcessedWord {
    word: string;
    syllables: string[];
    vowels: number[][];
}

export function processTextToWords(text: string): ProcessedWord[] {
    const rawWords = text.split(/\s+/).filter(word => word.length > 0);
    return rawWords.map(word => {
        const syllables = detectSyllables(word);
        const vowels = syllables.map(syl => getVowelIndices(syl));
        return {
            word,
            syllables,
            vowels
        };
    });
}
