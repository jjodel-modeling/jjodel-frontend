export declare function estimateBrowserZoom(_window: Window): number;
export declare function estimateWindowBorder(_window: Window, addBorder?: boolean): [number, number, number];
interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}
export declare function mapElementToScreenRect(element: HTMLElement, rect?: Rect): Rect;
export declare function mapWindowToElement(targetElement: HTMLElement, fromWindow?: Window, fromRect?: Rect, removeBorder?: boolean): Rect;
export {};
