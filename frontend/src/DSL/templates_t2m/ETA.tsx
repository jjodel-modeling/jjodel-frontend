export class ETA{
    public static flexmi_attribute = `<%/* ── Partial: render a single attribute (:key="value") ──────────────── */%>
<% E.fn.renderAttr = (key, val) => { %>
 :<%= key %>="<%= val %>"<% } %>`;
    public static flexmi_object = `<%/* ── Partial: render one object as a Flexmi tag ─────────────────────── */%>
<%/* tagName = the key under which this object lives in its parent        */%>
<% E.fn.renderObject = (tagName, obj, indent) => {
     const pad = " ".repeat(indent);
     const attrs   = Object.entries(obj).filter(([k,v]) => typeof v === "string" || typeof v === "number");
     const children= Object.entries(obj).filter(([k,v]) => Array.isArray(v));
%>
<%= pad %><<%= tagName %><% for (const [k,v] of attrs) { E.fn.renderAttr(k,v); } %><% if (children.length === 0) { %>/><% } else { %>>
<% for (const [k, arr] of children) {
     for (const child of arr) {
       E.fn.renderObject(k.replace(/s$/, ""), child, indent + 2);
     }
   } %>
<%= pad %></<%= tagName %>><% } %>
<% } %>
`;
    static flexmi_model = `
<%/* ── Root render ─────────────────────────────────────────────────────── */%>
<%~ \`<?xml version="1.0" encoding="UTF-8"?>\` %>
<% for (const root of it.rootElements) E.fn.renderObject("root", root, 0) %>`
}