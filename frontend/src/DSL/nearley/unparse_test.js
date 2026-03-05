import randexp from "randexp"
import _ from "lodash"

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