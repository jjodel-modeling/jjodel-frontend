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

/* ── Root render ─────────────────────────────────────────────────────── */
/*~ `<?xml version="1.0" encoding="UTF-8"?>` */
let model = it.ecore;
model = Object.values(model)[0]; // strip first root
let tagName = it.instanceof?.name || "Value";
let children = Object.entries(model).filter( ([k, v]) => typeof v === "object");
console.log("model eta", {model, it, children});
let multiRoot = children.reduce( (sum, [k, v]) => sum + v?.length, 0) > 1;

if (multiRoot) {
__eta.res+='<_>';
for (let [tagName, arr] of children) {
    if (!arr) arr = [];
    if (!Array.isArray(arr)) arr = [arr];

}


return __eta.res;
}