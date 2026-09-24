/**
 * Share Utilities
 * Functions for managing public share links using project ID
 */

/**
 * Generate public URL using project ID
 * Format: https://app.jjodel.io/#/project?id=PROJECT_ID
 */
export function getPublicProjectUrl(projectId: string): string {
    const baseUrl = 'https://app.jjodel.io';
    return `${baseUrl}/#/project?id=${projectId}`;
}

/**
 * Generate a stand-alone environment URL for a project + profile (#157).
 * Format: <origin>/#/project?id=PROJECT_ID&profile=PROFILE_ID
 * Uses window.location.origin so the link works wherever the app is served
 * (localhost while testing, production otherwise), unlike getPublicProjectUrl
 * which is pinned to the production host.
 */
export function getStandaloneEnvironmentUrl(projectId: string, profileId: string): string {
    const origin = (typeof window !== 'undefined' && window.location?.origin) || 'https://app.jjodel.io';
    return `${origin}/#/project?id=${projectId}&profile=${profileId}`;
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
