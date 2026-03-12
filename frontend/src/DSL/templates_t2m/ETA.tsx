export class ETA{
    public static flexmi_ValueInline = `<%/* ── Partial: render a single value inline ─────────────────── */
/* Partial parameters:
   -tagName
   -val
   -indent
*/
%><%= tagName %>="<%= val + "" %>"`;
    public static flexmi_ValueChild = `<%/* ── Partial: render a single value as sub-element ───────────────────
/* Partial parameters:
   -tagName
   -val
   -indent
*/
%><<%= tagName %>><%= val + "" %></<%= tagName %>>`;

    public static flexmi_ObjectChild = `<%/* ── Partial: render one object as a Flexmi tag ─────────────────────── */%>
<%
const pad      = " ".repeat(indent);
const attrs    = Object.entries(obj).filter(([k,v]) => typeof v === "string" || typeof v === "number");
const children = Object.entries(obj).filter(([k,v]) => Array.isArray(v));
%><%= pad %><<%= tagName %><%
    for (const [k,v] of attrs) { %><%~
     include("ValueInline", { key: k, val: v }) %><%
    }
%><%
    if (children.length === 0) {
%>/><%
} else { %>>
<% for (const [k, arr] of children) {
       for (const child of arr) {
           if (typeof child === 'object') {
               %><%~ include("ObjectChild", { tagName: k, obj: child, indent: indent + 2 }) %><%
           } else {
%><%= include("ValueChild", { tagName: k, val: child, indent: indent + 2 }) %>
} } %>
<%= pad %></<%= tagName %>><% } %>
`;

    static flexmi_model = `
<%/* ── Root render ─────────────────────────────────────────────────────── */%>
<%~ \`<?xml version="1.0" encoding="UTF-8"?>\` %>
<%
const obj = it.ecore;
if (Array.isArray(obj)) { for (const root of obj) { %><%~
    include("ObjectChild", { tagName: it.name, obj: root, indent: 0 })
}} else {%><%~
    include("ObjectChild", { tagName: it.name, obj, indent: 0 })
%><%}%>`

    static flexmi_object = `
<%/* ── Root render ─────────────────────────────────────────────────────── */%>
const obj = it.ecore;
<%~include("ObjectChild", { tagName: it.name, obj, indent: 0 })%>
`
    static flexmi_value = `
<%/* ── Root render ─────────────────────────────────────────────────────── */%>
<%
const obj = it.ecore;
if (Array.isArray(obj)) for( const root of obj ) { %><%~
    include("ValueChild", { tagName: it.name, val: root, indent: 0 })
%><%} else {%><%~
    include("ValueChild", { tagName: it.name, val: obj, indent: 0 })
%><%}%>`


}