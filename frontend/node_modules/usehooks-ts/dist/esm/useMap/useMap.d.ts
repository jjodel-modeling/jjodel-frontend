export declare type MapOrEntries<K, V> = Map<K, V> | [K, V][];
export interface Actions<K, V> {
    set: (key: K, value: V) => void;
    setAll: (entries: MapOrEntries<K, V>) => void;
    remove: (key: K) => void;
    reset: Map<K, V>['clear'];
}
declare type Return<K, V> = [Omit<Map<K, V>, 'set' | 'clear' | 'delete'>, Actions<K, V>];
declare function useMap<K, V>(initialState?: MapOrEntries<K, V>): Return<K, V>;
export default useMap;
