/**
 * Pastel accent colors for project cards
 * Each project gets a consistent color based on its name
 */
const ACCENT_COLORS = [
  '#93c5fd', // blue pastello
  '#6ee7b7', // emerald pastello
  '#c4b5fd', // violet pastello
  '#fcd34d', // amber pastello
  '#fca5a5', // red pastello
  '#67e8f9', // cyan pastello
  '#f9a8d4', // pink pastello
  '#bef264', // lime pastello
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
