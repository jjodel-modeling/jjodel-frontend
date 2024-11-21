declare type Handler = (event: MouseEvent) => void;
declare function useClickAnyWhere(handler: Handler): void;
export default useClickAnyWhere;
