/**
 * Accent colors for project cards
 * Each project gets a consistent color based on its name
 */
const ACCENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#84cc16', // lime
  '#6366f1', // indigo
  '#14b8a6', // teal
];

/**
 * Returns a consistent accent color based on the project name hash
 */
export function getAccentColor(projectName: string): string {
  const hash = projectName
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return ACCENT_COLORS[hash % ACCENT_COLORS.length];
}
