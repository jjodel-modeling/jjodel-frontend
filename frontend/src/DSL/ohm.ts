import * as ohm from 'ohm-js';
import {Log, RuntimeAccessible} from "../joiner";

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
    type?: string;
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

@RuntimeAccessible('Ohm')
export class Ohm {
    static flexmi_grammar: string;
    static flexmi_semantic: string;
    static exampleM1: string;
    private grammar: ohm.Grammar;
    private semantics: ohm.Semantics;

    constructor(dsl_grammar: string) {
        this.grammar = ohm.grammar(dsl_grammar);
        this.semantics = this.grammar.createSemantics();
    }

    public parse(dsl_instanceText: string){
        const match = this.grammar.match(dsl_instanceText);
        // console.log('ohm', {match, t:this});
        if (match.failed()) Log.ee('Ohm grammar failed to match, reason: ' + match.message, {match});
        let ret = this.semantics(match);
        // console.log('ohm 2', {ret, match, t:this});
        let ast = ret.ast() as Document;
        // console.log('ohm 3', {ast, ret, match, t:this});
        return ast;
    }

    addSemantics(sem: ohm.ActionDict<unknown>){
        this.semantics.addOperation('ast', sem);
        return this;
    }


    static usage_flexmi(flexmi: string){
        let ohm = new Ohm('some grammar');
        ohm.addSemantics({'some semantics to create proper ast well parsed': true as any});
        return ohm.parse(flexmi)
        /*
        const m = grammar.match(source.trim());
        if (m.failed()) throw new Error(m.message);
        return sem(m).ast() as Document;
        */
    }

}
@RuntimeAccessible('OHM') export class OHM extends Ohm { }

Ohm.flexmi_grammar = String.raw`
  Flexmi {

    Document
      = PI* Element

    // Top-level element: either a multi-root wrapper or a single element
    Element
      = "<_>" Node* "</_>"                            --multiroot
      | "<" tagName Attr* "/>"                        --selfclose
      | "<" tagName Attr* ">" Node* "</" tagName ">"  --full

    // A node inside an element body
    Node
      = PI
      | TemplateDef
      | "<" tagName Attr* "/>"                        --selfclose
      | "<" tagName Attr* ">" Node* "</" tagName ">"  --full
      | textChars                                     --text

    // <?target content?>  — reusable partial, used at doc level and inside nodes
    PI
      = "<?" piTarget piBody "?>"

    piTarget = letter (alnum | "_" | "-" | ".")*
    piBody   = (~"?>" any)*

    // <:template name="x"> <:param .../> <:content>...</:content> </:template>
    TemplateDef
      = "<:template" Attr* ">" TmplChild* "</:template>"

    TmplChild
      = "<:param" Attr* "/>"                          -- param
      | "<:content>" Node* "</:content>"              -- content
      | "<" tagName Attr* "/>"                        -- selfclose
      | "<" tagName Attr* ">" Node* "</" tagName ">"  -- full

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
`;

Ohm.flexmi_semantic = String.raw`
() => {
    function makeElement(nameNode, attrsIter = [], rawChildren = []) {
        let obj = {
            // type:     'Element',
            _tagName:     nameNode.sourceString.trim(),
        };
        let attrs = attrsIter.children.map(a => a.ast());
        // console.log('makeelement ' + obj._tagName, {obj, attrs, rawChildren});
        for (let attr of attrs) {
           obj[attr.name] = attr.value;
        }
        for (let attr of rawChildren.filter(e=>!!e)) {
           if (!obj[attr._tagName]) obj[attr._tagName] = [];
           obj[attr._tagName].push(attr);
           delete attr._tagName;
        }
        return obj;
    }
    
    return {
        Document: (pis, el) => {
            let root = el.ast();            
            delete root._tagName;
            return root;
        },
        /*Document(pis, el) {
        // pis = processing instructions, like <?nsuri psl?, <?import some.model?>, <?include other.flexmi?>
        // ignored in this version
        return el.ast();
            return {
                type: 'Document',
                pis:  pis.children.map(p => p.ast()),
                root: el.ast(),
            }
        },*/
        Element_multiroot(_o, nodes, _c) {
            let children = nodes.children.map(n => n.ast()).filter(x => x != null);
            for (let c of children) delete c._tagName;
            return children;
        },
        Element_selfclose: (_lt, name, attrs, _sl) => makeElement(name, attrs, []),
        Element_full: (_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) => (
            makeElement(name, attrs, nodes.children.map(n => n.ast()))
        ),
    
        Node_selfclose: (_lt, name, attrs, _sl) => makeElement(name, attrs, []),
        Node_full: (_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) => (
            makeElement(name, attrs, nodes.children.map(n => n.ast()))
        ),
        Node_text(chars) {
            const v = chars.sourceString.trim();
            return v ? ({ type: 'Text', value: v }) : null;
        },
        Node: n => n.ast(),
    
        PI: (_lt, target, body, _close) => ({
            type:    'PI',
            target:  target.sourceString.trim(),
            content: body.sourceString.trim(),
        }),
    
        TemplateDef(_lt, attrs, _gt, children, _cl) {
            const kids = children.children.map(c => c.ast());
            return {
                type:     'TemplateDef',
                attrs:    attrs.children.map(a => a.ast()),
                params:   kids.filter(k => k?.type === 'Param'),
                content:  kids.filter(k => k?.type === 'Content'),
                elements: kids.filter(k => k?.type === 'Element'),
            }
        },
        TmplChild_param: (_lt, attrs, _sl) => ({
            type:  'Param',
            attrs: attrs.children.map(n => a.ast())
        }),
        TmplChild_content: (_lt, nodes, _cl) => ({
            type:     'Content',
            children: nodes.children.map(n => n.ast()).filter(x => x != null),
        }),
        TmplChild_selfclose: (_lt, name, attrs, _sl) => makeElement(name, attrs, []),
        TmplChild_full: (_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) => (
            makeElement(name, attrs, nodes.children.map(n => n.ast()))
        ),
    
        Attr(name, _eq, val) {
            name = name.ast();
            return { name: name.raw, value: val.ast(), ...(name.exec ? {type: 'Expression'} : {}) }
        },
        attrName_prefixed: (_c, name) => ({ exec: true, raw: name.sourceString.trim() }),
        attrName_plain: (name) => ({ exec: false, raw: name.sourceString.trim() }),
        attrValue: (_oq, chars, _cq) => chars.sourceString,
    
        _iter: (...children) => children.map((c) => c.ast()),
        _terminal: ()         => this.sourceString,
    }
}`

// <?nsuri http://example.org/library?>
Ohm.exampleM1 = String.raw`
<Library name="CentralLibrary">
    <authors name="George Orwell2">
      <books title="19842" />
    </authors>
    <authors name="George Orwell">
      <books title="1984" />
    </authors>
</Library>`;

let exampleM1_old = String.raw`
<Library name="CentralLibrary">

  <books title="1984">
    <author name="George Orwell"/>
  </books>

  <books title="Brave New World">
    <author name="Aldous Huxley"/>
  </books>

</Library>`;

// ---------------------------------------------------------------------------
// SHARED HELPERS
// ---------------------------------------------------------------------------

function rootNodes(doc: Document): AnyNode[] {
    return doc.root.type === 'MultiRoot' ? doc.root.children : [doc.root as ElementNode];
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
    function findPI(doc: Document, target: string): string | null {
        const p = doc.pis.find((pi) => pi.target === target);
        return p ? p.content : null;
    }
    function xmiNodes(nodes: AnyNode[], out: string[], pad: string, ns: string): void {
        function escXML(s: string): string {
            return s
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;');
        }
        for (const n of nodes) {
            if (!n) continue;
            if (n.type === 'PI') {
                out.push(`${pad}<!-- ?${n.target} ${n.content} -->`);
                continue;
            }
            if (n.type === 'Element') {
                const attrs = n.attrs.map((a) => {
                        const k = (a.type === 'Expression' ? "xmi:" : "") + a.name;
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
                continue;
            }
        }
    }

    const ns = findPI(doc, 'nsuri') ?? 'model';
    const lines: string[] = [
        `<?xml version="1.0" encoding="UTF-8"?>`,
        `<${ns}:root xmlns:${ns}="http://example.org/${ns}">`,
    ];
    xmiNodes(rootNodes(doc), lines, '  ', ns);
    lines.push(`</${ns}:root>`);
    return lines.join('\n');
}

// ---------------------------------------------------------------------------
// SERIALIZER: YAML
// ---------------------------------------------------------------------------

export function toYAML(doc: Document): string {
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
    const lines: string[] = [];
    for (const pi of doc.pis) lines.push(`"?${pi.target}": ${pi.content}`);
    lines.push('nodes:');
    yamlNodes(rootNodes(doc), lines, '  ');
    return lines.join('\n');
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
    function attrStr(attrs: Attr[]): string {
        return attrs.map((a) => `${a.name.raw}="${a.value}"`).join(' ');
    }
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

export const flexmi = { toJSON, toXMI, toYAML, toFlexmi };
(window as any).ohm = ohm;
(window as any).flexmi = flexmi;
export {ohm};