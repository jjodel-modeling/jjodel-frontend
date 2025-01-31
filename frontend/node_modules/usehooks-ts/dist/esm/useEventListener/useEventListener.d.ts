import { RefObject } from 'react';
declare function useEventListener<K extends keyof MediaQueryListEventMap>(eventName: K, handler: (event: MediaQueryListEventMap[K]) => void, element: RefObject<MediaQueryList>, options?: boolean | AddEventListenerOptions): void;
declare function useEventListener<K extends keyof WindowEventMap>(eventName: K, handler: (event: WindowEventMap[K]) => void, element?: undefined, options?: boolean | AddEventListenerOptions): void;
declare function useEventListener<K extends keyof HTMLElementEventMap, T extends HTMLElement = HTMLDivElement>(eventName: K, handler: (event: HTMLElementEventMap[K]) => void, element: RefObject<T>, options?: boolean | AddEventListenerOptions): void;
declare function useEventListener<K extends keyof DocumentEventMap>(eventName: K, handler: (event: DocumentEventMap[K]) => void, element: RefObject<Document>, options?: boolean | AddEventListenerOptions): void;
export default useEventListener;
