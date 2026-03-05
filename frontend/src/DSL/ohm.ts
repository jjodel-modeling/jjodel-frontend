import * as ohm from 'ohm-js';

// Flexmi parser + serializers
// Paste into DevTools console. Requires ohm-js already on the page (window.ohm).
//
// Usage:
//   const ast = flexmi.parse(str);
//   flexmi.toJSON(ast)
//   flexmi.toXMI(ast)
//   flexmi.toYAML(ast)
//   flexmi.toFlexmi(ast)   // canonical round-trip

const test = (() => {

    // ---------------------------------------------------------------------------
    // GRAMMAR
    // ---------------------------------------------------------------------------

    const grammar = ohm.grammar(`
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
    // SEMANTICS  →  plain JS object tree (AST)
    // ---------------------------------------------------------------------------

    const sem = grammar.createSemantics();

    sem.addOperation('ast', {

        Document(pis, el) {
            return { type: 'Document', pis: pis.children.map(p => p.ast()), root: el.ast() };
        },

        Element_multiroot(_o, nodes, _c) {
            return { type: 'MultiRoot', children: compact(nodes.children.map(n => n.ast())) };
        },
        Element_selfclose(_lt, name, attrs, _sl) {
            return element(name, attrs, []);
        },
        Element_full(_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) {
            return element(name, attrs, nodes.children.map(n => n.ast()));
        },

        Node_selfclose(_lt, name, attrs, _sl) {
            return element(name, attrs, []);
        },
        Node_full(_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) {
            return element(name, attrs, nodes.children.map(n => n.ast()));
        },
        Node_text(chars) {
            const v = chars.sourceString.trim();
            return v ? { type: 'Text', value: v } : null;
        },
        Node(n) { return n.ast(); },

        PI(_lt, target, body, _close) {
            return { type: 'PI', target: target.sourceString.trim(), content: body.sourceString.trim() };
        },

        TemplateDef(_lt, attrs, _gt, children, _cl) {
            const kids = children.children.map(c => c.ast());
            return {
                type: 'TemplateDef',
                attrs:    attrs.children.map(a => a.ast()),
                params:   kids.filter(k => k && k.type === 'Param'),
                content:  kids.filter(k => k && k.type === 'Content'),
                elements: kids.filter(k => k && k.type === 'Element'),
            };
        },
        TmplChild_param(_lt, attrs, _sl) {
            return { type: 'Param', attrs: attrs.children.map(a => a.ast()) };
        },
        TmplChild_content(_lt, nodes, _cl) {
            return { type: 'Content', children: compact(nodes.children.map(n => n.ast())) };
        },
        TmplChild_selfclose(_lt, name, attrs, _sl) {
            return element(name, attrs, []);
        },
        TmplChild_full(_lt, name, attrs, _gt, nodes, _cl, _cn, _cgt) {
            return element(name, attrs, nodes.children.map(n => n.ast()));
        },

        Attr(name, _eq, val) {
            return { name: name.ast(), value: val.ast() };
        },
        attrName_prefixed(_c, name) {
            return { exec: true, raw: ':' + name.sourceString.trim() };
        },
        attrName_plain(name) {
            return { exec: false, raw: name.sourceString.trim() };
        },
        attrValue(_oq, chars, _cq) {
            return chars.sourceString;
        },

        _iter(...children) { return children.map(c => c.ast()); },
        _terminal()        { return this.sourceString; },
    });

    function element(nameNode, attrsIter, rawChildren) {
        return {
            type: 'Element',
            name: nameNode.sourceString.trim(),
            attrs: attrsIter.children.map(a => a.ast()),
            children: compact(rawChildren),
        };
    }

    function compact(arr) { return arr.filter(Boolean); }

    // ---------------------------------------------------------------------------
    // SHARED HELPERS
    // ---------------------------------------------------------------------------

    function rootNodes(ast) {
        return ast.root.type === 'MultiRoot' ? ast.root.children : [ast.root];
    }

    function findPI(ast, target) {
        const p = (ast.pis || []).find(p => p.target === target);
        return p ? p.content : null;
    }

    function attrStr(attrs, sep = ' ') {
        return attrs.map(a => `${a.name.raw}="${a.value}"`).join(sep);
    }

    function escXML(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------------------------------------------------------------------------
    // SERIALIZER: JSON
    // ---------------------------------------------------------------------------

    function toJSON(ast) {
        return JSON.stringify(ast, null, 2);
    }

    // ---------------------------------------------------------------------------
    // SERIALIZER: XMI
    // ---------------------------------------------------------------------------

    function toXMI(ast) {
        const ns = findPI(ast, 'nsuri') || 'model';
        const lines = [
            `<?xml version="1.0" encoding="UTF-8"?>`,
            `<${ns}:root xmlns:${ns}="http://example.org/${ns}">`,
        ];
        xmiNodes(rootNodes(ast), lines, '  ', ns);
        lines.push(`</${ns}:root>`);
        return lines.join('\n');
    }

    function xmiNodes(nodes, out, pad, ns) {
        for (const n of nodes) {
            if (!n) continue;
            if (n.type === 'PI') {
                out.push(`${pad}<!-- ?${n.target} ${n.content} -->`);
            } else if (n.type === 'Element') {
                const attrs = n.attrs.map(a => {
                    const k = a.name.exec ? 'xmi:' + a.name.raw.slice(1) : a.name.raw;
                    return ` ${k}="${escXML(a.value)}"`;
                }).join('');
                const kids = n.children.filter(c => c.type !== 'Text');
                const text = n.children.find(c => c.type === 'Text');
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

    function toYAML(ast) {
        const lines = [];
        for (const pi of ast.pis) lines.push(`"?${pi.target}": ${pi.content}`);
        lines.push('nodes:');
        yamlNodes(rootNodes(ast), lines, '  ');
        return lines.join('\n');
    }

    function yamlNodes(nodes, out, pad) {
        for (const n of nodes) {
            if (!n) continue;
            if (n.type === 'PI') {
                out.push(`${pad}- "?${n.target}": ${n.content}`);
            } else if (n.type === 'Element') {
                const kids = n.children.filter(c => c.type !== 'Text');
                const text = n.children.find(c => c.type === 'Text');
                out.push(`${pad}- ${n.name}:`);
                for (const a of n.attrs)
                    out.push(`${pad}    ${a.name.raw}: "${a.value}"`);
                if (text)
                    out.push(`${pad}    _text: "${text.value}"`);
                if (kids.length)
                    yamlNodes(kids, out, pad + '    ');
            } else if (n.type === 'TemplateDef') {
                const name = (n.attrs.find(a => a.name.raw === 'name') || {}).value || '?';
                out.push(`${pad}- ":template":`);
                out.push(`${pad}    name: "${name}"`);
                for (const p of n.params) {
                    const pn = (p.attrs.find(a => a.name.raw === 'name') || {}).value || '?';
                    out.push(`${pad}    - ":param": "${pn}"`);
                }
            }
        }
    }

    // ---------------------------------------------------------------------------
    // SERIALIZER: canonical Flexmi (round-trip)
    // ---------------------------------------------------------------------------

    function toFlexmi(ast) {
        const lines = [];
        for (const pi of ast.pis) lines.push(`<?${pi.target} ${pi.content}?>`);
        const nodes = rootNodes(ast);
        const multi = ast.root.type === 'MultiRoot';
        if (multi) lines.push('<_>');
        flexmiNodes(nodes, lines, multi ? '  ' : '');
        if (multi) lines.push('</_>');
        return lines.join('\n');
    }

    function flexmiNodes(nodes, out, pad) {
        for (const n of nodes) {
            if (!n) continue;
            if (n.type === 'PI') {
                out.push(`${pad}<?${n.target} ${n.content}?>`);
            } else if (n.type === 'Element') {
                const as = attrStr(n.attrs);
                const tag = as ? `${n.name} ${as}` : n.name;
                const kids = n.children.filter(c => c.type !== 'Text');
                const text = n.children.find(c => c.type === 'Text');
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

    function parse(source) {
        const m = grammar.match(source.trim());
        if (m.failed()) throw new Error(m.message);
        return sem(m).ast();
    }

    return { parse, toJSON, toXMI, toYAML, toFlexmi };

});
const flexmi = test();

(window as any).ohm = ohm;
(window as any).flexmitest = test;
(window as any).flexmi = flexmi;