/*	This work is licensed under Creative Commons GNU LGPL License.

	License: http://creativecommons.org/licenses/LGPL/2.1/
   Version: 0.9
	Author:  Stefan Goessner/2006
	Web:     http://goessner.net/
*/
export const inlineAttributePrefix = '@';
var X = {
   toObj: function(xml) {
      var o = {};
      if (xml.nodeType==1) {   // element node ..
         if (xml.attributes.length)   // element with attributes  ..
            for (var i=0; i<xml.attributes.length; i++)
               o[inlineAttributePrefix+xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue||"").toString(); // dam: qua parsa attribs
         if (xml.firstChild) { // element has child nodes ..
            var textChild=0, cdataChild=0, hasElementChild=false;
            for (var n=xml.firstChild; n; n=n.nextSibling) {
               if (n.nodeType==1) hasElementChild = true;
               else if (n.nodeType==3 && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
               else if (n.nodeType==4) cdataChild++; // cdata section node
            }
            if (hasElementChild) {
               if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
                  X.removeWhite(xml);
                  for (var n=xml.firstChild; n; n=n.nextSibling) {
                     if (n.nodeType == 3)  // text node
                        o["#text"] = X.escape(n.nodeValue);
                     else if (n.nodeType == 4)  // cdata node
                        o["#cdata"] = X.escape(n.nodeValue);
                     else if (o[n.nodeName]) {  // multiple occurence of element ..
                        if (o[n.nodeName] instanceof Array)
                           o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                        else
                           o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                     }
                     else  // first occurence of element..
                        o[n.nodeName] = X.toObj(n); // damiano: qua parsa sottonodi
                  }
               }
               else { // mixed content
                  if (!xml.attributes.length)
                     o = X.escape(X.innerXml(xml));
                  else
                     o["#text"] = X.escape(X.innerXml(xml));
               }
            }
            else if (textChild) { // pure text
               if (!xml.attributes.length)
                  o = X.escape(X.innerXml(xml));
               else
                  o["#text"] = X.escape(X.innerXml(xml));
            }
            else if (cdataChild) { // cdata
               if (cdataChild > 1)
                  o = X.escape(X.innerXml(xml));
               else
                  for (var n=xml.firstChild; n; n=n.nextSibling)
                     o["#cdata"] = X.escape(n.nodeValue);
            }
         }
         if (!xml.attributes.length && !xml.firstChild) o = null;
      }
      else if (xml.nodeType==9) { // document.node
         o = X.toObj(xml.documentElement);
      }
      else console.error("unhandled xml node type: " + xml.nodeType, {xml, nodetype:xml.nodeType});
      return o;
   },
   toJson: function(o, name, ind) {
      var json = name ? ("\""+name+"\"") : "";
      if (o instanceof Array) {
         for (var i=0,n=o.length; i<n; i++)
            o[i] = X.toJson(o[i], "", ind+"\t");
         json += (name?":[":"[") + (o.length > 1 ? ("\n"+ind+"\t"+o.join(",\n"+ind+"\t")+"\n"+ind) : o.join("")) + "]";
      }
      else if (o == null)
         json += (name&&":") + "null";
      else if (typeof(o) == "object") {
         var arr = [];
         for (var m in o)
            arr[arr.length] = X.toJson(o[m], m, ind+"\t");
         json += (name?":{":"{") + (arr.length > 1 ? ("\n"+ind+"\t"+arr.join(",\n"+ind+"\t")+"\n"+ind) : arr.join("")) + "}";
      }
      else if (typeof(o) == "string")
         json += (name&&":") + "\"" + o.toString() + "\"";
      else
         json += (name&&":") + o.toString();
      return json;
   },
   innerXml: function(node) {
      var s = ""
      if ("innerHTML" in node)
         s = node.innerHTML;
      else {
         var asXml = function(n) {
            var s = "";
            if (n.nodeType == 1) {
               s += "<" + n.nodeName;
               for (var i=0; i<n.attributes.length;i++)
                  s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue||"").toString() + "\"";
               if (n.firstChild) {
                  s += ">";
                  for (var c=n.firstChild; c; c=c.nextSibling)
                     s += asXml(c);
                  s += "</"+n.nodeName+">";
               }
               else
                  s += "/>";
            }
            else if (n.nodeType == 3)
               s += n.nodeValue;
            else if (n.nodeType == 4)
               s += "<![CDATA[" + n.nodeValue + "]]>";
            return s;
         };
         for (var c=node.firstChild; c; c=c.nextSibling)
            s += asXml(c);
      }
      return s;
   },
   escape: function(txt) {
      return txt.replace(/[\\]/g, "\\\\")
          .replace(/[\"]/g, '\\"')
          .replace(/[\n]/g, '\\n')
          .replace(/[\r]/g, '\\r');
   },
   removeWhite: function(e) {
      e.normalize();
      for (var n = e.firstChild; n; ) {
         if (n.nodeType == 3) {  // text node
            if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
               var nxt = n.nextSibling;
               e.removeChild(n);
               n = nxt;
            }
            else
               n = n.nextSibling;
         }
         else if (n.nodeType == 1) {  // element node
            X.removeWhite(n);
            n = n.nextSibling;
         }
         else                      // any other node
            n = n.nextSibling;
      }
      return e;
   }
};

function parseXml(xml/*:string*/) {
   var dom = null;
   if (window.DOMParser) {
      try {
         dom = (new DOMParser()).parseFromString(xml, "text/xml");
      }
      catch (e) { dom = null; }
   }
   else if (window.ActiveXObject) {
      try {
         // eslint-disable-next-line no-undef
         dom = new ActiveXObject('Microsoft.XMLDOM');
         dom.async = false;
         if (!dom.loadXML(xml)) // parse error ..

            window.alert(dom.parseError.reason + dom.parseError.srcText);
      }
      catch (e) { dom = null; }
   }
   else
      alert("cannot parse xml string!");
   return dom;
}

export function xml2json(xml/*document|string*/, tab = '    '/*XML_DOM, string*/, asString = false) {
   if (typeof xml === 'string') xml = parseXml(xml);
   // document node
   if (xml.nodeType == 9) xml = xml.documentElement;
   let obj = X.toObj(X.removeWhite(xml));
   if (!asString) return obj;
   var json = X.toJson(obj, xml.nodeName, "\t");
   return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
}
export function xml2jsonobj(xml, tab= '    '){
   return X.toObj(X.removeWhite(xml));
}


export function json2xml(o, tab/*obj, string*/) {
   var toXml = function(v, name, ind) {
      var xml = "";
      if (v instanceof Array) {
         for (var i=0, n=v.length; i<n; i++)
            xml += ind + toXml(v[i], name, ind+"\t") + "\n";
      }
      else if (typeof(v) == "object") {
         var hasChild = false;
         xml += ind + "<" + name;
         for (var m in v) {
            if (m.charAt(0) == "@")
               xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
            else
               hasChild = true;
         }
         xml += (hasChild ? ">" : "/>") + '\n'+ind; // damiano aggiunta: + '\n'+ind;
         if (hasChild) {
            for (var m in v) {
               if (m == "#text")
                  xml += v[m];
               else if (m == "#cdata")
                  xml += "<![CDATA[" + v[m] + "]]>";
               else if (m.charAt(0) != "@")
                  xml += toXml(v[m], m, ind+"\t");
            }
            xml += (xml.charAt(xml.length-1)=="\n"?ind:"") + "</" + name + ">" + '\n'+ind; // damiano aggiunta: + '\n'+ind;
         }
      }
      else {
         xml += ind + "<" + name + ">" + v.toString() +  "</" + name + ">" + '\n'+ind; // damiano aggiunta: + '\n'+ind;
      }
      return xml;
   }, xml="";
   if (typeof o === 'string') {
      try {o = JSON.parse(o); } catch(e) { o = {error: "XML.fromJSON parameter is not a valid JSON object or string"}; }
   }
   for (var m in o)
      xml += toXml(o[m], m, "");
   return xml;
   // return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
}

export const XML = {parse: parseXml, toJson:xml2json, toJsonObject: xml2jsonobj, fromJSON:json2xml};
export const XMI = XML;
// damiano: i need X.toObj(X.removeWhite(xml))
