/**
 * Browser detection utility for Jjodel
 * Detects if the user is using a Chromium-based browser
 */

export interface BrowserInfo {
    name: string;
    isChromiumBased: boolean;
    version?: string;
}

/**
 * Detect the current browser and check if it's Chromium-based
 * @returns BrowserInfo object with browser details
 */
export function detectBrowser(): BrowserInfo {
    const userAgent = navigator.userAgent;
    const vendor = navigator.vendor || '';

    // Chrome and Chromium-based browsers
    if (/Chrome/.test(userAgent) && /Google Inc/.test(vendor)) {
        // Check for specific Chromium browsers
        if (/Edg/.test(userAgent)) {
            return { name: 'Edge', isChromiumBased: true };
        }
        if (/OPR/.test(userAgent) || /Opera/.test(userAgent)) {
            return { name: 'Opera', isChromiumBased: true };
        }
        if (/Brave/.test(userAgent)) {
            return { name: 'Brave', isChromiumBased: true };
        }
        if (/Vivaldi/.test(userAgent)) {
            return { name: 'Vivaldi', isChromiumBased: true };
        }
        return { name: 'Chrome', isChromiumBased: true };
    }

    // Firefox
    if (/Firefox/.test(userAgent)) {
        return { name: 'Firefox', isChromiumBased: false };
    }

    // Safari
    if (/Safari/.test(userAgent) && /Apple Computer/.test(vendor)) {
        return { name: 'Safari', isChromiumBased: false };
    }

    // Internet Explorer
    if (/Trident/.test(userAgent) || /MSIE/.test(userAgent)) {
        return { name: 'Internet Explorer', isChromiumBased: false };
    }

    // Unknown browser
    return { name: 'Unknown', isChromiumBased: false };
}

/**
 * Check if browser warning has already been shown in this session
 */
export function hasShownBrowserWarning(): boolean {
    return sessionStorage.getItem('jjodel_browser_warning_shown') === 'true';
}

/**
 * Mark browser warning as shown for this session
 */
export function markBrowserWarningShown(): void {
    sessionStorage.setItem('jjodel_browser_warning_shown', 'true');
}

/**
 * Check if we should show the browser warning
 */
export function shouldShowBrowserWarning(): boolean {
    const browser = detectBrowser();

    // Don't show if already shown in this session
    if (hasShownBrowserWarning()) {
        return false;
    }

    // Don't show if using Chromium-based browser
    if (browser.isChromiumBased) {
        return false;
    }

    // Show warning for non-Chromium browsers
    return true;
}
