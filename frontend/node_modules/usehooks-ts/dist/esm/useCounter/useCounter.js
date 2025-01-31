import { useState } from 'react';
function useCounter(initialValue) {
    const [count, setCount] = useState(initialValue || 0);
    const increment = () => setCount(x => x + 1);
    const decrement = () => setCount(x => x - 1);
    const reset = () => setCount(initialValue || 0);
    return {
        count,
        increment,
        decrement,
        reset,
        setCount,
    };
}
export default useCounter;
