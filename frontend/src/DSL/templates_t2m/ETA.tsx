export class ETA{
    public static flexmi_ValueInline = `<%/* ── Partial: render a single value inline ─────────────────── */
const { tagName, val } = it;%>
<%= tagName %>="<%= val + "" %>"`;
    public static flexmi_ValueChild = `<%/* ── Partial: render a single value as sub-element ───────────────────*/
const { tagName, val, indent } = it;
console.log("ValueChild", {it, arguments, val});
%>@<%= "valchild" %>#<%
if (typeof val === 'object') {%>preobj<%= include("ObjectChild", { tagName, obj: val, indent: indent + 2}) %> postobj<%return;
}
%><%=
  "__ValueChild__\t" %><%=
" ".repeat(indent) %><<%= tagName %>><%=val + "" %></<%= tagName %>>`;

    public static flexmi_ObjectChild = `<%/* ── Partial: render one object as a Flexmi tag ─────────────────────── */
const { tagName, obj, indent } = it;
const attrs    = Object.entries(obj).filter(([k,v]) => typeof v === "string" || typeof v === "number");
const children = Object.entries(obj).filter(([k,v]) => typeof v === "object"); // Array.isArray(v));
const pad = " ".repeat(indent);
console.log("eta objectChild", {it, arguments, tagName, obj, attrs, children});
if (true) { %>__<%= "Objectt" %>__<% }
%><%= pad %><<%= tagName %><%
    for (const [k,v] of attrs) { %><%~
     include("ValueInline", { tagName: k, val: v}) %><%
    }
%><%
    if (children.length === 0) {
%>/><%
       
    }
%>>
<% for (let [k, arr] of children) {
       console.log("objectchild arr", {k, arr});
       arr = [];
       for (const child of arr) {
           if (typeof child === 'object') {
               %><%~ include("ObjectChild", { tagName: k, obj: child, indent: indent + 2 }) %><%
           } else {
%><%=
               include("ValueChild", { tagName: k, val: child, indent: indent + 2 })
%><%       }
       } %>
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
let tagName = it.instanceof?.name || "Value";
console.log('eta value', {it, obj, tagName});
if (Array.isArray(obj)) for( const root of obj ) {
%><%~include("ValueChild", { tagName, val: root, indent: 0 })
%><%} else {%><%~
    include("ValueChild", { tagName, val: obj, indent: 0 })
%><%}%>`


}