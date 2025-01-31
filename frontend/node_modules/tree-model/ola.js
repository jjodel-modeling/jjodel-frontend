var TreeModel = require('./index.js'),
    tree = new TreeModel(),
    root = tree.parse({name: '1', children: [{name: '1_1', children: [{name: '1_1_1'}]},{name: '1_2'}]});
var html = '';
root.dfs(
  (n, ctrl) => {
    if (n.model.name === '1_1') ctrl.skipChildren();
    html += ('(' + n.model.name + (n.hasChildren() ? ' ' : ''));
  },
  (n, ctrl) => html += (ctrl.isLastChild() ? ')' : ') '));
//root.dfs((n, ctx) => console.log(ctx), _ => {});
console.log(html)
