// Suggestion usage tracking for autocomplete frequency optimization

interface SuggestionUsageData {
  count: number;
  lastUsed: number; // timestamp
}

interface SuggestionUsage {
  [key: string]: SuggestionUsageData;
}

interface UsageStats {
  totalSuggestions: number;
  totalUses: number;
  topTen: Array<{
    suggestion: string;
    count: number;
    percentage: number;
  }>;
}

const USAGE_STORAGE_KEY = 'jjodel_console_suggestion_usage';

// Default top suggestions for new users
export const DEFAULT_TOP_SUGGESTIONS = [
  'data',
  'node',
  'view',
  'component',
  'data.name',
  'data.className',
  'data.packages',
  'data.classes',
  'node.name',
  'JSON.stringify(data, null, 2)'
];

// Get usage data from localStorage
export const getSuggestionUsage = (): SuggestionUsage => {
  try {
    const stored = localStorage.getItem(USAGE_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error('Failed to parse suggestion usage:', e);
    return {};
  }
};

// Update usage count for a suggestion
export const updateSuggestionUsage = (suggestion: string): void => {
  try {
    const usage = getSuggestionUsage();

    usage[suggestion] = {
      count: (usage[suggestion]?.count || 0) + 1,
      lastUsed: Date.now()
    };

    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(usage));
  } catch (e) {
    console.error('Failed to update suggestion usage:', e);
  }
};

// Reset all usage data
export const resetSuggestionUsage = (): void => {
  try {
    localStorage.removeItem(USAGE_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to reset suggestion usage:', e);
  }
};

// Sort suggestions by frequency with recency factor
export const sortSuggestionsByFrequency = (suggestions: string[]): string[] => {
  const usage = getSuggestionUsage();

  // Calculate score for each suggestion
  const scored = suggestions.map(suggestion => {
    const usageData = usage[suggestion];
    const count = usageData?.count || 0;
    const lastUsed = usageData?.lastUsed || 0;

    // Score: usage count * recency factor
    const daysSinceUsed = (Date.now() - lastUsed) / (1000 * 60 * 60 * 24);
    const recencyFactor = Math.max(0.1, 1 - (daysSinceUsed / 30)); // Decay over 30 days
    const score = count * recencyFactor;

    return {
      suggestion,
      score,
      count,
      isDefault: DEFAULT_TOP_SUGGESTIONS.includes(suggestion)
    };
  });

  // Sort by score, with default suggestions prioritized for new users
  scored.sort((a, b) => {
    // Prioritize default suggestions when no usage data exists
    if (a.count === 0 && b.count === 0) {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
    }

    // Then sort by score
    if (b.score !== a.score) return b.score - a.score;

    // Then alphabetically
    return a.suggestion.localeCompare(b.suggestion);
  });

  return scored.map(s => s.suggestion);
};

// Get usage statistics
export const getUsageStats = (): UsageStats => {
  const usage = getSuggestionUsage();
  const entries = Object.entries(usage);

  const totalUses = entries.reduce((sum, [, data]) => sum + data.count, 0);
  const topTen = entries
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10);

  return {
    totalSuggestions: entries.length,
    totalUses,
    topTen: topTen.map(([suggestion, data]) => ({
      suggestion,
      count: data.count,
      percentage: totalUses > 0 ? (data.count / totalUses) * 100 : 0
    }))
  };
};
