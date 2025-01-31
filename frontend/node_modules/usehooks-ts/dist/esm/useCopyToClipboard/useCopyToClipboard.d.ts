declare type CopiedValue = string | null;
declare type CopyFn = (text: string) => Promise<boolean>;
declare function useCopyToClipboard(): [CopiedValue, CopyFn];
export default useCopyToClipboard;
