import { Dispatch, SetStateAction } from 'react';
declare global {
    interface WindowEventMap {
        'session-storage': CustomEvent;
    }
}
declare type SetValue<T> = Dispatch<SetStateAction<T>>;
declare function useSessionStorage<T>(key: string, initialValue: T): [T, SetValue<T>];
export default useSessionStorage;
