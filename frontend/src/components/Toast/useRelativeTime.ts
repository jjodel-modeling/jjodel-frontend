import { useEffect, useState } from 'react';

const TICK_MS = 10_000;

const subscribers = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureInterval(): void {
    if (intervalId !== null) return;
    intervalId = setInterval(() => {
        for (const cb of subscribers) cb();
    }, TICK_MS);
}

function maybeStopInterval(): void {
    if (subscribers.size === 0 && intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
    }
}

export function formatRelativeTime(timestamp: number | Date): string {
    const ms = timestamp instanceof Date ? timestamp.getTime() : timestamp;
    const diff = Date.now() - ms;
    if (diff < 5_000) return 'now';
    if (diff < 60_000) return `${Math.floor(diff / 1000)}s`;
    if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m`;
    return `${Math.floor(diff / (60 * 60_000))}h`;
}

export function useRelativeTime(timestamp: number | Date): string {
    const [label, setLabel] = useState(() => formatRelativeTime(timestamp));

    useEffect(() => {
        setLabel(formatRelativeTime(timestamp));
        const tick = () => setLabel(formatRelativeTime(timestamp));
        subscribers.add(tick);
        ensureInterval();
        return () => {
            subscribers.delete(tick);
            maybeStopInterval();
        };
    }, [timestamp]);

    return label;
}
