interface UseCountdownType {
    seconds: number;
    interval: number;
    isIncrement?: boolean;
}
interface CountdownHelpers {
    start: () => void;
    stop: () => void;
    reset: () => void;
}
interface CountdownOption {
    countStart: number;
    intervalMs?: number;
    isIncrement?: boolean;
    countStop?: number;
}
interface CountdownControllers {
    startCountdown: () => void;
    stopCountdown: () => void;
    resetCountdown: () => void;
}
declare function useCountdown(countdownOption: UseCountdownType): [number, CountdownHelpers];
declare function useCountdown(countdownOption: CountdownOption): [number, CountdownControllers];
export default useCountdown;
