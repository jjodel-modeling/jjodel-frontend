export class test{

    static debugcompile(){
let include = (__eta_t, __eta_d) => this.render(__eta_t, {...it, ...(__eta_d ?? {})}, options);
let includeAsync = (__eta_t, __eta_d) => this.renderAsync(__eta_t, {...it, ...(__eta_d ?? {})}, options);

let __eta = {res: "", e: this.config.escapeFunction, f: this.config.filterFunction};

function layout(path, data) {
  __eta.layout = path;
  __eta.layoutData = data;
}

function output(s){__eta.res+=s;}

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
__eta.res+=__eta.e(include("ValueChild", { tagName: k, val: child, indent: indent + 2 }));
}
       }
__eta.res+=__eta.e(pad);
__eta.res+='</';
__eta.res+=__eta.e(tagName);
__eta.res+='>';
}

return __eta.res;


    }
}