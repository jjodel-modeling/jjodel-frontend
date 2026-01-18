/**
 * Share Utilities
 * Functions for managing public share links using project ID
 */

/**
 * Generate public URL using project ID
 * Format: http://app.jjodel.io/#/project?id=PROJECT_ID
 */
export function getPublicProjectUrl(projectId: string): string {
    const baseUrl = 'http://app.jjodel.io';
    return `${baseUrl}/#/project?id=${projectId}`;
}

/**
 * Check if a project can be shared (is public)
 */
export function canShareProject(project: { type?: string }): boolean {
    return project.type === 'public';
}

/**
 * Extract project ID from URL
 */
export function extractProjectIdFromUrl(url: string): string | null {
    try {
        const match = url.match(/[?&]id=([^&]+)/);
        return match ? match[1] : null;
    } catch {
        return null;
    }
}

/**
 * Copy text to clipboard with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        try {
            const input = document.createElement('input');
            input.value = text;
            input.style.position = 'fixed';
            input.style.opacity = '0';
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);
            return true;
        } catch (fallbackErr) {
            console.error('Failed to copy:', fallbackErr);
            return false;
        }
    }
}
