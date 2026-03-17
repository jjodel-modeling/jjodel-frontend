export class ETA{
    public static flexmi_ValueInline = `<%/* ── Partial: render a single value inline ─────────────────── */
const { tagName, val } = it;
%> <%= tagName %>="<%= val + "" %>"`;
    public static flexmi_ValueChild = `<%/* ── Partial: render a single value as sub-element ───────────────────*/
const { tagName, val, indent } = it;
console.log("ValueChild", {it, arguments, val});
%><%
if (typeof val === 'object') {%><%~ include("ObjectChild", { tagName, obj: val, indent: indent + 2}) %><%
} else {%><%=
" ".repeat(indent) %><<%= tagName %>><%=val + "" %></<%= tagName %>><%}%>`;

    public static flexmi_ObjectChild = `<%/* ── Partial: render one object as a Flexmi tag ─────────────────────── */
const { tagName, obj, indent } = it;
const attrs    = Object.entries(obj).filter(([k,v]) => typeof v === "string" || typeof v === "number");
const children = Object.entries(obj).filter(([k,v]) => typeof v === "object"); // Array.isArray(v));
const pad = " ".repeat(indent);
console.log("eta objectChild", {it, arguments, tagName, obj, attrs, children});
%><%= pad %><<%= tagName %><%
    for (const [k,v] of attrs) { %><%~ include("ValueInline", { tagName: k, val: v})%><%}
%><%
if (children.length === 0) {%> /><%}
else {%>>
<%
    for (let [k, arr] of children) {
        console.log("objectchild arr", {k, arr});
        if (!arr) arr = [];
        if (!Array.isArray(arr)) arr = [arr];
        for (const child of arr) {
            if (typeof child === 'object') {
                %><%~ include("ObjectChild", { tagName: k, obj: child, indent: indent + 2 }) %><%
            } else {
%><%=
               include("ValueChild", { tagName: k, val: child, indent: indent + 2 })
%><%       }
       }
   }
   %>
\n<%= pad %></<%= tagName %>>
<%
} %>
`;

    static flexmi_model = `
<%/* ── Root render ─────────────────────────────────────────────────────── */%>
<?nsuri http://example.org/library?>
<%
let model = it.ecore;
model = Object.values(model)[0]; // strip first root
let tagName = it.instanceof?.name || "Value";
let children = Object.entries(model).filter( ([k, v]) => typeof v === "object");
console.log("model eta", {model, it, children});
let multiRoot = children.reduce( (sum, [k, v]) => sum + v?.length, 0) > 1;
let indent = 0;
if (multiRoot) { indent = 2; %><_>\n<%}
for (let [tagName, arr] of children) {
    if (!arr) arr = [];
    if (!Array.isArray(arr)) arr = [arr];
    for (let obj of arr) {
    %><%~
        include("ObjectChild", { tagName, obj, indent })
    }
}
if (multiRoot) {%></_><%}
%>`;

    static flexmi_object = `
<%/* ── Root render ─────────────────────────────────────────────────────── */
const obj = it.ecore;
%><%~include("ObjectChild", { tagName: it.instanceof?.name||'Object', obj, indent: 0 })%>
`
    static flexmi_value = `
<%/* ── Root render ─────────────────────────────────────────────────────── */
const obj = it.ecore;
let tagName = it.instanceof?.name || "Value";
console.log('eta value', {it, obj, tagName});
if (Array.isArray(obj)) for( const root of obj ) {
%><%~include("ValueChild", { tagName, val: root, indent: 0 })
%><%} else {%><%~
    include("ValueChild", { tagName, val: obj, indent: 0 })
%><%}%>`


}