/**
 * JjScript Detection
 * Detects if a code block contains JjScript (formal or natural syntax)
 */

// Patterns that indicate JjScript content
const JJSCRIPT_PATTERNS = [
    // Formal JjScript (starts with /)
    /^\/\w+/,

    // Natural language - Classes
    /^create\s+(abstract\s+)?class\s+/i,
    /^add\s+(abstract\s+)?class\s+/i,

    // Natural language - Attributes
    /^create\s+attribute\s+/i,
    /^add\s+attribute\s+/i,

    // Natural language - References
    /^create\s+(reference|composition|aggregation)\s+/i,
    /^add\s+(reference|composition|aggregation)\s+/i,

    // Natural language - Enums
    /^create\s+enum\s+/i,
    /^add\s+enum\s+/i,
    /^add\s+literal\s+/i,

    // Natural language - Packages
    /^create\s+package\s+/i,
    /^add\s+package\s+/i,

    // Natural language - Operations
    /^create\s+operation\s+/i,
    /^add\s+operation\s+/i,

    // Natural language - Inheritance
    /^\w+\s+extends\s+\w+$/i,
    /^set\s+parent\s+of\s+/i,
    /^make\s+\w+\s+extend\s+/i,

    // Natural language - Documentation
    /^set\s+doc(umentation)?\s+/i,
    /^document\s+\w+/i,

    // Natural language - Delete/Remove
    /^delete\s+(class|attribute|reference|enum|package)?\s*\w+/i,
    /^remove\s+(class|attribute|reference|enum|package)?\s*\w+/i,

    // Natural language - Rename
    /^rename\s+/i,

    // Natural language - Show/List
    /^show\s+/i,
    /^list\s+(classes|enums|packages|attributes|references|all)/i,

    // Utility commands
    /^undo$/i,
    /^redo$/i,
    /^clear$/i,
    /^help(\s+\w+)?$/i,

    // Short attribute syntax: Class.attr: Type
    /^\w+\.\w+\s*:\s*\w+/i,
];

// Patterns that indicate NOT JjScript (common programming languages)
const NON_JJSCRIPT_PATTERNS = [
    // JavaScript/TypeScript
    /^(const|let|var|function|class\s+\w+\s*\{|import|export|async|await)\s/,
    /^\s*(if|else|for|while|switch|try|catch)\s*\(/,
    /=>\s*\{/,
    /\(\s*\)\s*=>/,

    // Python
    /^(def|import|from|if __name__|class\s+\w+:)/,
    /^\s*@\w+/,

    // Java/C#
    /^(public|private|protected|static|void|int|String|boolean)\s/,
    /^package\s+[\w.]+;/,
    /^using\s+[\w.]+;/,

    // HTML/XML
    /^<\/?[a-zA-Z][^>]*>/,

    // JSON
    /^\s*[\[{]/,

    // Shell
    /^#!/,
    /^\$\s/,

    // SQL
    /^(SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|ALTER|DROP)\s/i,
];

/**
 * Check if a single line is likely JjScript
 */
export function isJjScriptLine(line: string): boolean {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) {
        return false;
    }

    // Check against non-JjScript patterns first
    for (const pattern of NON_JJSCRIPT_PATTERNS) {
        if (pattern.test(trimmed)) {
            return false;
        }
    }

    // Check against JjScript patterns
    for (const pattern of JJSCRIPT_PATTERNS) {
        if (pattern.test(trimmed)) {
            return true;
        }
    }

    return false;
}

/**
 * Detect if a code block is JjScript (formal or natural syntax)
 * Returns a confidence score between 0 and 1
 */
export function detectJjScript(code: string): { isJjScript: boolean; confidence: number; matchedLines: number } {
    const lines = code.split('\n').filter(l => {
        const trimmed = l.trim();
        return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#');
    });

    if (lines.length === 0) {
        return { isJjScript: false, confidence: 0, matchedLines: 0 };
    }

    let matchedLines = 0;
    let nonMatchedLines = 0;

    for (const line of lines) {
        if (isJjScriptLine(line)) {
            matchedLines++;
        } else {
            nonMatchedLines++;
        }
    }

    const confidence = matchedLines / lines.length;

    // Consider it JjScript if more than 50% of lines match
    // or if at least one line matches and there are no non-JjScript lines
    const isJjScript = confidence > 0.5 || (matchedLines > 0 && nonMatchedLines === 0);

    return { isJjScript, confidence, matchedLines };
}

/**
 * Quick check if code block is JjScript
 */
export function isJjScriptCode(code: string): boolean {
    return detectJjScript(code).isJjScript;
}

/**
 * Detect the type of JjScript syntax
 */
export function detectSyntaxType(code: string): 'formal' | 'natural' | 'mixed' | 'unknown' {
    const lines = code.split('\n').filter(l => {
        const trimmed = l.trim();
        return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('#');
    });

    if (lines.length === 0) {
        return 'unknown';
    }

    let formalCount = 0;
    let naturalCount = 0;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('/')) {
            formalCount++;
        } else if (isJjScriptLine(trimmed)) {
            naturalCount++;
        }
    }

    if (formalCount > 0 && naturalCount === 0) {
        return 'formal';
    }
    if (naturalCount > 0 && formalCount === 0) {
        return 'natural';
    }
    if (formalCount > 0 && naturalCount > 0) {
        return 'mixed';
    }

    return 'unknown';
}
