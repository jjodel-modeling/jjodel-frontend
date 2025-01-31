import { Dispatch, SetStateAction } from 'react';
interface UseCounterOutput {
    count: number;
    increment: () => void;
    decrement: () => void;
    reset: () => void;
    setCount: Dispatch<SetStateAction<number>>;
}
declare function useCounter(initialValue?: number): UseCounterOutput;
export default useCounter;
