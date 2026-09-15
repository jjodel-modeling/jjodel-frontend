import * as ohm from 'ohm-js';

(window as any).ohm = ohm;
// Flexmi parser + serializers
// Requires ohm-js
//
// Usage:
//   const ast = flexmi.parse(str);
//   flexmi.toJSON(ast)
//   flexmi.toXMI(ast)
//   flexmi.toYAML(ast)
//   flexmi.toFlexmi(ast)   // canonical round-trip


// ---------------------------------------------------------------------------
// AST TYPES
// ---------------------------------------------------------------------------

export interface AttrName {
    exec: boolean;  // true when prefixed with ":" (exec / var / ref attributes)
    raw:  string;   // full attribute name including leading ":" if exec
}

export interface Attr {
    name:  AttrName;
    value: string;
}

export interface PINode {
    type:    'PI';
    target:  string;
    content: string;
}

export interface TextNode {
    type:  'Text';
    value: string;
}

export interface ElementNode {
    type:     'Element';
    name:     string;
    attrs:    Attr[];
    children: AnyNode[];
}

export interface ParamNode {
    type:  'Param';
    attrs: Attr[];
}

export interface ContentNode {
    type:     'Content';
    children: AnyNode[];
}

export interface TemplateDefNode {
    type:     'TemplateDef';
    attrs:    Attr[];           // carries "name" attribute
    params:   ParamNode[];
    content:  ContentNode[];
    elements: ElementNode[];
}

export interface MultiRootNode {
    type:     'MultiRoot';
    children: AnyNode[];
}

export type RootNode = MultiRootNode | ElementNode;

export type AnyNode =
    | PINode
    | TextNode
    | ElementNode
    | TemplateDefNode
    | ParamNode
    | ContentNode;

export interface Document {
    type: 'Document';
    pis:  PINode[];
    root: RootNode;
}

// ---------------------------------------------------------------------------
// GRAMMAR
// ---------------------------------------------------------------------------

const grammar = ohm.grammar(String.raw`
  Flexmi {

    Document
      = PI* Element

    // Top-level element: either a multi-root wrapper or a single element
    Element
      = "<_>" Node* "</_>"                                       -- multiroot
      | "<" tagName Attr* "/>"                                   -- selfclose
      | "<" tagName Attr* ">" Node* "</" tagName ">"            -- full

    // A node inside an element body
    Node
      = PI
      | TemplateDef
      | "<" tagName Attr* "/>"                                   -- selfclose
      | "<" tagName Attr* ">" Node* "</" tagName ">"            -- full
      | textChars                                                -- text

    // <?target content?>  — reusable partial, used at doc level and inside nodes
    PI
      = "<?" piTarget piBody "?>"

    piTarget = letter (alnum | "_" | "-" | ".")*
    piBody   = (~"?>" any)*

    // <:template name="x"> <:param .../> <:content>...</:content> </:template>
    TemplateDef
      = "<:template" Attr* ">" TmplChild* "</:template>"

    TmplChild
      = "<:param" Attr* "/>"                                     -- param
      | "<:content>" Node* "</:content>"                        -- content
      | "<" tagName Attr* "/>"                                   -- selfclose
      | "<" tagName Attr* ">" Node* "</" tagName ">"            -- full

    // Attribute  name="val"  or  :name="val"  (exec / var / ref)
    Attr
      = attrName "=" attrValue

    attrName
      = ":" tagName   -- prefixed
      | tagName       -- plain

    attrValue
      = "\"" (~"\"" any)* "\""
      | "'"  (~"'"  any)* "'"

    textChars = (~"<" any)+

    tagName
      = (letter | "_") (alnum | "_" | "-" | "." | ":")*

    space
     := " " | "\\t" | "\\n" | "\\r"
  }
`);

// ---------------------------------------------------------------------------
// SEMANTICS  →  typed AST
// ---------------------------------------------------------------------------

const sem = grammar.createSemantics();

// Helper used inside semantic actions — builds an ElementNode
function makeElement(
    nameNode: ohm.NonterminalNode,
    attrsIter: ohm.NonterminalNode,
    rawChildren: Array<AnyNode | null>,
): ElementNode {
    return {
        type:     'Element',
        name:     nameNode.sourceString.trim(),
        attrs:    attrsIter.children.map((a) => a.ast() as Attr),
        children: compact(rawChildren),
    };
}

function compact<T>(arr: Array<T | null | undefined>): T[] {
    return arr.filter((x): x is T => x != null);
}

let e;
sem.addOperation<unknown>('ast', {

    Document(pis, el) {
        return {
            type: 'Document',
            pis:  pis.children.map((p) => p.ast() as PINode),
            root: el.ast() as RootNode,
        } satisfies Document;
    },

    Element_multiroot(_o, nodes, _c) {
        return {
            type:     'MultiRoot',
            children: compact(nodes.children.map((n) => n.ast() as AnyNode | null)),
        } satisfies MultiRootNode;
    },
    Element_selfclose(_lt, name, attrs, _sl) {
        return makeElement(name, attrs, []);
    },
    Element_full(_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) {
        return makeElement(name, attrs, nodes.children.map((n) => n.ast() as AnyNode | null));
    },

    Node_selfclose(_lt, name, attrs, _sl) {
        return makeElement(name, attrs, []);
    },
    Node_full(_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) {
        return makeElement(name, attrs, nodes.children.map((n) => n.ast() as AnyNode | null));
    },
    Node_text(chars) {
        const v = chars.sourceString.trim();
        return v ? ({ type: 'Text', value: v } satisfies TextNode) : null;
    },
    Node(n) { return n.ast(); },

    PI(_lt, target, body, _close) {
        return {
            type:    'PI',
            target:  target.sourceString.trim(),
            content: body.sourceString.trim(),
        } satisfies PINode;
    },

    TemplateDef(_lt, attrs, _gt, children, _cl) {
        const kids = children.children.map((c) => c.ast() as AnyNode);
        return {
            type:     'TemplateDef',
            attrs:    attrs.children.map((a) => a.ast() as Attr),
            params:   kids.filter((k): k is ParamNode   => k?.type === 'Param'),
            content:  kids.filter((k): k is ContentNode => k?.type === 'Content'),
            elements: kids.filter((k): k is ElementNode => k?.type === 'Element'),
        } satisfies TemplateDefNode;
    },
    TmplChild_param(_lt, attrs, _sl) {
        return {
            type:  'Param',
            attrs: attrs.children.map((a) => a.ast() as Attr),
        } satisfies ParamNode;
    },
    TmplChild_content(_lt, nodes, _cl) {
        return {
            type:     'Content',
            children: compact(nodes.children.map((n) => n.ast() as AnyNode | null)),
        } satisfies ContentNode;
    },
    TmplChild_selfclose(_lt, name, attrs, _sl) {
        return makeElement(name, attrs, []);
    },
    TmplChild_full(_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) {
        return makeElement(name, attrs, nodes.children.map((n) => n.ast() as AnyNode | null));
    },

    Attr(name, _eq, val) {
        return {
            name:  name.ast() as AttrName,
            value: val.ast()  as string,
        } satisfies Attr;
    },
    attrName_prefixed(_c, name) {
        return { exec: true, raw: ':' + name.sourceString.trim() } satisfies AttrName;
    },
    attrName_plain(name) {
        return { exec: false, raw: name.sourceString.trim() } satisfies AttrName;
    },
    attrValue(_oq, chars, _cq) {
        return chars.sourceString;
    },

    _iter(...children) { return children.map((c) => c.ast()); },
    _terminal()        { return this.sourceString; },
});

// ---------------------------------------------------------------------------
// SHARED HELPERS
// ---------------------------------------------------------------------------

function rootNodes(doc: Document): AnyNode[] {
    return doc.root.type === 'MultiRoot' ? doc.root.children : [doc.root as ElementNode];
}

function findPI(doc: Document, target: string): string | null {
    const p = doc.pis.find((pi) => pi.target === target);
    return p ? p.content : null;
}

function attrStr(attrs: Attr[]): string {
    return attrs.map((a) => `${a.name.raw}="${a.value}"`).join(' ');
}

function escXML(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// SERIALIZER: JSON
// ---------------------------------------------------------------------------

export function toJSON(doc: Document): string {
    return JSON.stringify(doc, null, 2);
}

// ---------------------------------------------------------------------------
// SERIALIZER: XMI
// ---------------------------------------------------------------------------

export function toXMI(doc: Document): string {
    const ns = findPI(doc, 'nsuri') ?? 'model';
    const lines: string[] = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<${ns}:root xmlns:${ns}="http://example.org/${ns}">`,
    ];
    xmiNodes(rootNodes(doc), lines, '  ', ns);
    lines.push(`</${ns}:root>`);
    return lines.join('\n');
}

function xmiNodes(nodes: AnyNode[], out: string[], pad: string, ns: string): void {
    for (const n of nodes) {
        if (!n) continue;
        if (n.type === 'PI') {
            out.push(`${pad}<!-- ?${n.target} ${n.content} -->`);
        } else if (n.type === 'Element') {
            const attrs = n.attrs
                .map((a) => {
                    const k = a.name.exec ? `xmi:${a.name.raw.slice(1)}` : a.name.raw;
                    return ` ${k}="${escXML(a.value)}"`;
                })
                .join('');
            const kids = n.children.filter((c): c is ElementNode => c.type !== 'Text');
            const text  = n.children.find((c): c is TextNode     => c.type === 'Text');
            if (!kids.length && !text) {
                out.push(`${pad}<${ns}:${n.name}${attrs}/>`);
            } else if (!kids.length && text) {
                out.push(`${pad}<${ns}:${n.name}${attrs}>${escXML(text.value)}</${ns}:${n.name}>`);
            } else {
                out.push(`${pad}<${ns}:${n.name}${attrs}>`);
                xmiNodes(kids, out, pad + '  ', ns);
                out.push(`${pad}</${ns}:${n.name}>`);
            }
        } else if (n.type === 'TemplateDef') {
            out.push(`${pad}<!-- :template (not expanded in XMI) -->`);
        }
    }
}

// ---------------------------------------------------------------------------
// SERIALIZER: YAML
// ---------------------------------------------------------------------------

export function toYAML(doc: Document): string {
    const lines: string[] = [];
    for (const pi of doc.pis) lines.push(`"?${pi.target}": ${pi.content}`);
    lines.push('nodes:');
    yamlNodes(rootNodes(doc), lines, '  ');
    return lines.join('\n');
}

function yamlNodes(nodes: AnyNode[], out: string[], pad: string): void {
    for (const n of nodes) {
        if (!n) continue;
        if (n.type === 'PI') {
            out.push(`${pad}- "?${n.target}": ${n.content}`);
        } else if (n.type === 'Element') {
            const kids = n.children.filter((c): c is ElementNode => c.type !== 'Text');
            const text  = n.children.find((c): c is TextNode     => c.type === 'Text');
            out.push(`${pad}- ${n.name}:`);
            for (const a of n.attrs)
                out.push(`${pad}    ${a.name.raw}: "${a.value}"`);
            if (text)
                out.push(`${pad}    _text: "${text.value}"`);
            if (kids.length)
                yamlNodes(kids, out, pad + '    ');
        } else if (n.type === 'TemplateDef') {
            const name = n.attrs.find((a) => a.name.raw === 'name')?.value ?? '?';
            out.push(`${pad}- ":template":`);
            out.push(`${pad}    name: "${name}"`);
            for (const p of n.params) {
                const pn = p.attrs.find((a) => a.name.raw === 'name')?.value ?? '?';
                out.push(`${pad}    - ":param": "${pn}"`);
            }
        }
    }
}

// ---------------------------------------------------------------------------
// SERIALIZER: canonical Flexmi (round-trip)
// ---------------------------------------------------------------------------

export function toFlexmi(doc: Document): string {
    const lines: string[] = [];
    for (const pi of doc.pis) lines.push(`<?${pi.target} ${pi.content}?>`);
    const nodes = rootNodes(doc);
    const multi  = doc.root.type === 'MultiRoot';
    if (multi) lines.push('<_>');
    flexmiNodes(nodes, lines, multi ? '  ' : '');
    if (multi) lines.push('</_>');
    return lines.join('\n');
}

function flexmiNodes(nodes: AnyNode[], out: string[], pad: string): void {
    for (const n of nodes) {
        if (!n) continue;
        if (n.type === 'PI') {
            out.push(`${pad}<?${n.target} ${n.content}?>`);
        } else if (n.type === 'Element') {
            const as  = attrStr(n.attrs);
            const tag = as ? `${n.name} ${as}` : n.name;
            const kids = n.children.filter((c): c is ElementNode => c.type !== 'Text');
            const text  = n.children.find((c): c is TextNode     => c.type === 'Text');
            if (!kids.length && !text) {
                out.push(`${pad}<${tag}/>`);
            } else if (!kids.length && text) {
                out.push(`${pad}<${tag}>${text.value}</${n.name}>`);
            } else {
                out.push(`${pad}<${tag}>`);
                flexmiNodes(kids, out, pad + '  ');
                out.push(`${pad}</${n.name}>`);
            }
        } else if (n.type === 'TemplateDef') {
            const as = attrStr(n.attrs);
            out.push(`${pad}<:template ${as}>`);
            for (const p of n.params)
                out.push(`${pad}  <:param ${attrStr(p.attrs)}/>`);
            for (const c of n.content) {
                out.push(`${pad}  <:content>`);
                flexmiNodes(c.children, out, pad + '    ');
                out.push(`${pad}  </:content>`);
            }
            out.push(`${pad}</:template>`);
        }
    }
}

// ---------------------------------------------------------------------------
// PUBLIC API
// ---------------------------------------------------------------------------

export function parse(source: string): Document {
    const m = grammar.match(source.trim());
    if (m.failed()) throw new Error(m.message);
    return sem(m).ast() as Document;
}

export const flexmi = { parse, toJSON, toXMI, toYAML, toFlexmi };
(window as any).ohm = ohm;
(window as any).flexmi = flexmi;
export {ohm};