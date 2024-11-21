export declare type UseScriptStatus = 'idle' | 'loading' | 'ready' | 'error';
export interface UseScriptOptions {
    shouldPreventLoad?: boolean;
    removeOnUnmount?: boolean;
}
declare function useScript(src: string | null, options?: UseScriptOptions): UseScriptStatus;
export default useScript;
