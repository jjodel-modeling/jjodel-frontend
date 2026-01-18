/**
 * Version Utilities
 * Automatic versioning system with format vX.Y
 * - Y increments by 1 on each save
 * - When Y > 9, X increments and Y resets to 0
 * - Sequence: v1.0 → v1.1 → ... → v1.9 → v2.0 → v2.1 ...
 */

/**
 * Calculate the next version as a number (e.g., 3.4 → 3.5 → 3.9 → 4.0)
 * @param currentVersion - Current version as number (e.g., 3.4)
 * @returns Next version as number (e.g., 3.5)
 */
export function getNextVersionNumber(currentVersion?: number | string): number {
    // If no version or zero, start at 1.0
    if (!currentVersion || currentVersion === 0 || currentVersion === '') {
        return 1.0;
    }

    // Convert to number if string
    let version = typeof currentVersion === 'string'
        ? parseFloat(currentVersion.replace(/^v/i, ''))
        : currentVersion;

    // Handle NaN
    if (isNaN(version)) return 1.0;

    // Parse major.minor from the decimal
    const major = Math.floor(version);
    // Use rounding to avoid floating point issues (e.g., 3.4 → 4 not 3.9999...)
    const minor = Math.round((version - major) * 10);

    // Increment minor
    let newMinor = minor + 1;
    let newMajor = major;

    // If minor > 9, increment major and reset minor
    if (newMinor > 9) {
        newMajor++;
        newMinor = 0;
    }

    // Return as decimal (e.g., 3.5)
    return newMajor + (newMinor / 10);
}

/**
 * Calculate the next version as a string with 'v' prefix
 * @param currentVersion - Current version (e.g. "v3.4" or 3.4)
 * @returns Next version string (e.g. "v3.5")
 */
export function getNextVersion(currentVersion?: string | number): string {
    const nextNum = getNextVersionNumber(currentVersion);
    return `v${nextNum.toFixed(1)}`;
}

/**
 * Validate if a string is a valid version
 */
export function isValidVersion(version: string): boolean {
    return /^v?\d+\.\d+$/.test(version);
}

/**
 * Format a version ensuring it has the 'v' prefix
 */
export function formatVersion(version: string | number | undefined): string {
    if (!version) return 'v1.0';
    const versionStr = String(version);
    return versionStr.startsWith('v') ? versionStr : `v${versionStr}`;
}

/**
 * Compare two versions
 * @returns negative if v1 < v2, 0 if equal, positive if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
    const parse = (v: string) => {
        const clean = v.replace(/^v/i, '');
        const [major, minor] = clean.split('.').map(n => parseInt(n, 10) || 0);
        return { major, minor };
    };

    const ver1 = parse(v1);
    const ver2 = parse(v2);

    if (ver1.major !== ver2.major) {
        return ver1.major - ver2.major;
    }

    return ver1.minor - ver2.minor;
}

/**
 * Parse version string into major and minor components
 */
export function parseVersion(version: string | number | undefined): { major: number; minor: number } {
    if (!version) return { major: 1, minor: 0 };

    const versionStr = String(version).replace(/^v/i, '');
    const parts = versionStr.split('.');

    return {
        major: parseInt(parts[0] || '1', 10) || 1,
        minor: parseInt(parts[1] || '0', 10) || 0,
    };
}

/**
 * Get display string for version (e.g. "v2.3")
 */
export function getVersionDisplay(version: string | number | undefined): string {
    return formatVersion(version);
}
