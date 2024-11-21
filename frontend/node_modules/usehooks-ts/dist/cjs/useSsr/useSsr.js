"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function useSsr() {
    var isDOM = typeof window !== 'undefined' &&
        window.document &&
        window.document.documentElement;
    return {
        isBrowser: isDOM,
        isServer: !isDOM,
    };
}
exports.default = useSsr;
