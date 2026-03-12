export class test{

    static debugcompiledeta(){

let include = (__eta_t, __eta_d) => this.render(__eta_t, {...it, ...(__eta_d ?? {})}, options);
let includeAsync = (__eta_t, __eta_d) => this.renderAsync(__eta_t, {...it, ...(__eta_d ?? {})}, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}

function output(s){__eta.res+=s;}

/* ── Root render ─────────────────────────────────────────────────────── */
__eta.res+=`<?xml version="1.0" encoding="UTF-8"?>`;
const obj = it.ecore;
if (Array.isArray(obj)) { for (const root of obj) {
__eta.res+=include("ObjectChild", { tagName: it.name, obj: root, indent: 0 })
}} else {;
__eta.res+=include("ObjectChild", { tagName: it.name, obj, indent: 0 });
}
/* ── Root render ─────────────────────────────────────────────────────── */
__eta.res+='const obj = it.ecore;\n';
__eta.res+=include("ObjectChild", { tagName: it.name, obj, indent: 0 });
/* ── Root render ─────────────────────────────────────────────────────── */
const obj = it.ecore;
if (Array.isArray(obj)) for( const root of obj ) {
__eta.res+=include("ValueChild", { tagName: it.name, val: root, indent: 0 });
} else {
__eta.res+=include("ValueChild", { tagName: it.name, val: obj, indent: 0 });
}
/* ── Partial: render one object as a Flexmi tag ─────────────────────── */
const pad      = " ".repeat(indent);
const attrs    = Object.entries(obj).filter(([k,v]) => typeof v === "string" || typeof v === "number");
const children = Object.entries(obj).filter(([k,v]) => Array.isArray(v));
__eta.res+=__eta.e(pad);
__eta.res+='<';
__eta.res+=__eta.e(tagName);
for (const [k,v] of attrs) {
__eta.res+=include("ValueInline", { key: k, val: v });
}
if (children.length === 0) {
__eta.res+='/>';
} else {
__eta.res+='>\n';
for (const [k, arr] of children) {
       for (const child of arr) {
           if (typeof child === 'object') {
__eta.res+=include("ObjectChild", { tagName: k, obj: child, indent: indent + 2 });
} else {
<%= include("ValueChild", { tagName: k, val: child, indent: indent + 2 })
__eta.res+='} } %>\n';
__eta.res+=__eta.e(pad);
__eta.res+='</';
__eta.res+=__eta.e(tagName);
__eta.res+='>';
}
/* ── Partial: render a single value as sub-element ───────────────────
/* Partial parameters:
   -tagName
   -val
   -indent
*/
__eta.res+='<';
__eta.res+=__eta.e(tagName);
__eta.res+='>';
__eta.res+=__eta.e(val + "");
__eta.res+='</';
__eta.res+=__eta.e(tagName);
__eta.res+='>';
/* ── Partial: render a single value inline ─────────────────── */
/* Partial parameters:
   -tagName
   -val
   -indent
*/
__eta.res+=__eta.e(tagName);
__eta.res+='="';
__eta.res+=__eta.e(val + "");
__eta.res+='"Flexmi is usable only with partials so far.';

if (__eta.layout) {
  __eta.res = include (__eta.layout, {...it, body: __eta.res, ...__eta.layoutData});
}

return __eta.res;


    }
}