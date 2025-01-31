var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { useState } from 'react';
function useCopyToClipboard() {
    const [copiedText, setCopiedText] = useState(null);
    const copy = (text) => __awaiter(this, void 0, void 0, function* () {
        if (!(navigator === null || navigator === void 0 ? void 0 : navigator.clipboard)) {
            console.warn('Clipboard not supported');
            return false;
        }
        try {
            yield navigator.clipboard.writeText(text);
            setCopiedText(text);
            return true;
        }
        catch (error) {
            console.warn('Copy failed', error);
            setCopiedText(null);
            return false;
        }
    });
    return [copiedText, copy];
}
export default useCopyToClipboard;
