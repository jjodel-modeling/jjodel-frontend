import { useState, useEffect } from 'react';

const STORAGE_KEY = 'jjodel_donation_banner';
const SHOW_DELAY_MS = 30_000;
const MIN_DAYS_BETWEEN = 14;
const MAX_SHOW_COUNT = 4;

interface DonationBannerState {
    lastShown: number;
    showCount: number;
}

function readState(): DonationBannerState | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as DonationBannerState) : null;
    } catch {
        return null;
    }
}

function writeState(state: DonationBannerState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage might be unavailable
    }
}

function shouldShowBanner(state: DonationBannerState | null): boolean {
    if (!state) return true;
    if (state.showCount >= MAX_SHOW_COUNT) return false;
    const daysSinceLast = (Date.now() - state.lastShown) / (1000 * 60 * 60 * 24);
    return daysSinceLast >= MIN_DAYS_BETWEEN;
}

export interface UseDonationBannerResult {
    isVisible: boolean;
    dismiss: () => void;
}

export function useDonationBanner(): UseDonationBannerResult {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const state = readState();
        if (!shouldShowBanner(state)) return;

        const timer = setTimeout(() => {
            const currentState = readState();
            if (!shouldShowBanner(currentState)) return;

            const newState: DonationBannerState = {
                lastShown: Date.now(),
                showCount: (currentState?.showCount ?? 0) + 1,
            };
            writeState(newState);
            setIsVisible(true);
        }, SHOW_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    const dismiss = () => {
        setIsVisible(false);
    };

    return { isVisible, dismiss };
}
