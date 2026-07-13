/**
 * Minimal XML DOM for the headless round-trip suite.
 *
 * EcoreService.importFromXML and XMIService.importM1FromXML call
 * `new DOMParser().parseFromString(...)` and then only use:
 *   doc.querySelector('parsererror'), doc.documentElement,
 *   el.tagName, el.attributes (indexed, .name/.value), el.children,
 *   el.textContent.
 * This module provides exactly that surface so the PRODUCTION import code
 * paths run unmodified under node (no jsdom: CLAUDE.md forbids new deps).
 *
 * The parser is a character scanner (not regex-per-tag): attribute values may
 * legally contain '>' and entities, which UML.ecore exercises heavily.
 */

export class MiniAttr {
    constructor(public name: string, public value: string) {}
}

export class MiniElement {
    tagName: string;
    attributes: MiniAttr[] = [];
    children: MiniElement[] = [];
    parentElement: MiniElement | null = null;
    private ownText = '';

    constructor(tagName: string) {
        this.tagName = tagName;
    }

    appendText(t: string): void { this.ownText += t; }

    get textContent(): string {
        let s = this.ownText;
        for (const c of this.children) s += c.textContent;
        return s;
    }

    getAttribute(name: string): string | null {
        for (const a of this.attributes) if (a.name === name) return a.value;
        return null;
    }

    /** Only what the import services actually use: tag-name descendant lookup. */
    querySelector(selector: string): MiniElement | null {
        const want = selector.trim();
        if (want.includes(' ') || want.includes('>')) return null; // combinators unsupported
        const target = want.replace(/\\\\/g, '\\').replace('\\:', ':');
        const stack: MiniElement[] = [...this.children];
        while (stack.length) {
            const el = stack.shift() as MiniElement;
            if (el.tagName === target || el.tagName.split(':').pop() === target) return el;
            stack.push(...el.children);
        }
        return null;
    }
}

export class MiniDocument {
    constructor(public documentElement: MiniElement) {}
    querySelector(selector: string): MiniElement | null {
        if (selector === 'parsererror') return null; // parse errors throw instead
        if (this.documentElement.tagName === selector) return this.documentElement;
        return this.documentElement.querySelector(selector);
    }
}

const NAMED_ENTITIES: Record<string, string> = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
};

export function decodeEntities(s: string): string {
    if (s.indexOf('&') < 0) return s;
    return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body: string) => {
        if (body[0] === '#') {
            const code = body[1] === 'x' || body[1] === 'X'
                ? parseInt(body.substring(2), 16)
                : parseInt(body.substring(1), 10);
            return Number.isNaN(code) ? m : String.fromCodePoint(code);
        }
        return NAMED_ENTITIES[body] ?? m;
    });
}

export function parseXml(xml: string): MiniDocument {
    let i = 0;
    const n = xml.length;
    let root: MiniElement | null = null;
    const stack: MiniElement[] = [];

    const err = (msg: string): never => {
        const ctx = xml.substring(Math.max(0, i - 60), Math.min(n, i + 60));
        throw new Error(`XML parse error at offset ${i}: ${msg} — context: …${ctx}…`);
    };

    while (i < n) {
        const lt = xml.indexOf('<', i);
        if (lt < 0) break;
        // text between tags
        if (lt > i && stack.length > 0) {
            const text = xml.substring(i, lt);
            if (text.trim().length > 0) stack[stack.length - 1].appendText(decodeEntities(text));
        }
        i = lt;
        if (xml.startsWith('<?', i)) {                       // prolog / PI
            const end = xml.indexOf('?>', i);
            if (end < 0) err('unterminated processing instruction');
            i = end + 2;
            continue;
        }
        if (xml.startsWith('<!--', i)) {                     // comment
            const end = xml.indexOf('-->', i);
            if (end < 0) err('unterminated comment');
            i = end + 3;
            continue;
        }
        if (xml.startsWith('<![CDATA[', i)) {                // CDATA
            const end = xml.indexOf(']]>', i);
            if (end < 0) err('unterminated CDATA');
            if (stack.length > 0) stack[stack.length - 1].appendText(xml.substring(i + 9, end));
            i = end + 3;
            continue;
        }
        if (xml.startsWith('<!', i)) {                       // DOCTYPE etc.
            const end = xml.indexOf('>', i);
            if (end < 0) err('unterminated <! declaration');
            i = end + 1;
            continue;
        }
        if (xml.startsWith('</', i)) {                       // closing tag
            const end = xml.indexOf('>', i);
            if (end < 0) err('unterminated closing tag');
            const name = xml.substring(i + 2, end).trim();
            const open = stack.pop();
            if (!open || open.tagName !== name) err(`mismatched closing tag </${name}> (open: <${open?.tagName}>)`);
            i = end + 1;
            continue;
        }

        // opening tag: scan name, then attributes char by char (values may contain '>')
        i++; // skip '<'
        let j = i;
        while (j < n && !/[\s/>]/.test(xml[j])) j++;
        const el = new MiniElement(xml.substring(i, j));
        i = j;

        let selfClosing = false;
        for (;;) {
            while (i < n && /\s/.test(xml[i])) i++;
            if (i >= n) err('unterminated tag');
            if (xml[i] === '>') { i++; break; }
            if (xml[i] === '/') {
                if (xml[i + 1] !== '>') err("stray '/' in tag");
                selfClosing = true;
                i += 2;
                break;
            }
            // attribute name
            j = i;
            while (j < n && !/[\s=/>]/.test(xml[j])) j++;
            const attrName = xml.substring(i, j);
            i = j;
            while (i < n && /\s/.test(xml[i])) i++;
            if (xml[i] !== '=') { el.attributes.push(new MiniAttr(attrName, '')); continue; }
            i++;
            while (i < n && /\s/.test(xml[i])) i++;
            const quote = xml[i];
            if (quote !== '"' && quote !== "'") err(`attribute ${attrName} value not quoted`);
            i++;
            const endQ = xml.indexOf(quote, i);
            if (endQ < 0) err(`unterminated attribute value for ${attrName}`);
            el.attributes.push(new MiniAttr(attrName, decodeEntities(xml.substring(i, endQ))));
            i = endQ + 1;
        }

        if (stack.length > 0) {
            el.parentElement = stack[stack.length - 1];
            stack[stack.length - 1].children.push(el);
        } else if (!root) {
            root = el;
        } else {
            err('multiple root elements');
        }
        if (!selfClosing) stack.push(el);
    }

    if (stack.length > 0) throw new Error(`XML parse error: unclosed tag <${stack[stack.length - 1].tagName}>`);
    if (!root) throw new Error('XML parse error: no root element');
    return new MiniDocument(root);
}

/** Drop-in for the browser DOMParser, good enough for the import services. */
export class DOMParserShim {
    parseFromString(source: string, _type: string): MiniDocument {
        return parseXml(source);
    }
}

/** Install on globalThis so production code picks it up. */
export function installDomParserShim(): void {
    (globalThis as any).DOMParser = DOMParserShim;
}
