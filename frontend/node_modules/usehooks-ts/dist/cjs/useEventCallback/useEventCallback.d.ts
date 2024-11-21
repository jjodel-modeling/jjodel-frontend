export default function useEventCallback<Args extends unknown[], R>(fn: (...args: Args) => R): (...args: Args) => R;
