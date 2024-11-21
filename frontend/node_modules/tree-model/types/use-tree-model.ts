import TreeModel = require("..");

const tree = new TreeModel({});

const root = tree.parse({ name: 'a', children: [{ name: 'b' }, { name: 'c' }] });

console.log(root.model.name);