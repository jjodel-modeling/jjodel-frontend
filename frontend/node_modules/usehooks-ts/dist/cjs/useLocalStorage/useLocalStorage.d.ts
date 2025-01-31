import { Dispatch, SetStateAction } from 'react';
declare global {
    interface WindowEventMap {
        'local-storage': CustomEvent;
    }
}
declare type SetValue<T> = Dispatch<SetStateAction<T>>;
declare function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>];
export default useLocalStorage;
