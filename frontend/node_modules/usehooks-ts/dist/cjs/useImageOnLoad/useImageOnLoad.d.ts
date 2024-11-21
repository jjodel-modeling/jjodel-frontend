import { CSSProperties } from 'react';
interface ImageStyle {
    thumbnail: CSSProperties;
    fullSize: CSSProperties;
}
interface ImageOnLoadType {
    handleImageOnLoad: () => void;
    css: ImageStyle;
}
declare function useImageOnLoad(): ImageOnLoadType;
export default useImageOnLoad;
