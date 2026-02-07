declare module 'hypher' {
    export default class Hypher {
        constructor(languageData: unknown);
        hyphenate(word: string): string[];
        hyphenateText(text: string): string;
    }
}

declare module 'hyphenation.en-us' {
    const language: unknown;
    export default language;
}
