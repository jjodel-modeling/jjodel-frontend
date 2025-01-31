declare type Value<T> = T | null;
declare function useReadLocalStorage<T>(key: string): Value<T>;
export default useReadLocalStorage;
