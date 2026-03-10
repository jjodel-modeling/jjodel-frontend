import randexp from "randexp"
import _ from "lodash"

(() => {
    function makeElement(nameNode, attrsIter, rawChildren) {
        return {
            type:     'Element',
            name:     nameNode.sourceString.trim(),
            attrs:    attrsIter.children.map(a => a.ast()),
            children: rawChildren.filter(x => x != null),
        };
    }

    return {
        Document(pis, el) {
            return {
                type: 'Document',
                pis:  pis.children.map(p => p.ast()),
                root: el.ast(),
            }
        },
        Element_multiroot(_o, nodes, _c) {
            return {
                type:     'MultiRoot',
                children: nodes.children.map(n => n.ast()).filter(x => x != null),
            };
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

        Attr: (name, _eq, val)=> ({ name:  name.ast(), value: val.ast() }),
        attrName_prefixed: (_c, name) => ({ exec: true, raw: ':' + name.sourceString.trim() }),
        attrName_plain: (name) => ({ exec: false, raw: name.sourceString.trim() }),
        attrValue: (_oq, chars, _cq) => chars.sourceString,

        _iter: (...children) => children.map((c) => c.ast()),
        _terminal: ()         => this.sourceString,
    }
})

function unparse(grammar, options){
    options = options || {};

    var override_rule = options.override_rule || {};
    var start = options.start || grammar.start;
    var filterRule = options.filterRule || function(){return true};
    var max_stack_size = (options.max_stack_size >= 0)
        ? options.max_stack_size
        : 25;
    var max_loops = (options.max_loops >= 0)
        ? options.max_loops
        : 500;

    var stack = [start];
    var output = "";
    var stop_recusive_rules = false;

    var selectRule = function(currentname){
        var rules = grammar.rules.filter(function(x) {
            return x.name === currentname;
        });
        if(rules.length === 0){
            throw new Error("Nothing matches rule: "+currentname+"!");
        }
        return _.sample(_.filter(rules, function(rule){
            if(!filterRule(rule)){
                return false;
            }
            if(stop_recusive_rules || stack.length > max_stack_size){
                return !_.includes(rule.symbols, currentname);
            }
            return true;
        }));
    };

    var count = 0;

    console.log('nearley unparse stack 0', {stack, grammar, start, _, randexp});
    while(stack.length > 0){
        count++;
        if(!stop_recusive_rules && count > max_loops){
            stop_recusive_rules = true;
        }
        var currentname = stack.pop();
        if(override_rule.hasOwnProperty(currentname)){
            console.log('nearley unparse stack push 1', {val: override_rule[currentname](), override_rule, currentname});
            stack.push({literal: override_rule[currentname]()});
        }else if(typeof currentname === "string"){
            _.each(selectRule(currentname).symbols, function(symbol){
                console.log('nearley unparse stack push 2', {val: symbol, currentname, rule: selectRule(currentname)});
                stack.push(symbol);
            });
        }else if(currentname.test){
            output = new randexp(currentname).gen() + output;
        }else if(currentname.literal){
            output = currentname.literal + output;
        }
    }

    return output;
}
window.unparse = unparse;
module.exports = unparse;
export default unparse;