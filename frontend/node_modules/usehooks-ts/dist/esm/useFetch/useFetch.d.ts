interface State<T> {
    data?: T;
    error?: Error;
}
declare function useFetch<T = unknown>(url?: string, options?: RequestInit): State<T>;
export default useFetch;
