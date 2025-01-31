find-insert-index
=================

Find the index to insert an element in array keeping the sort order.

[![Build Status](https://travis-ci.org/joaonuno/find-insert-index-js.png)](https://travis-ci.org/joaonuno/find-insert-index-js)

# Example

```
var findInsertIndex, comparatorFn;
findInsertIndex = require('find-insert-index');
comparatorFn = function (a, b) {
  return a.id - b.id;
};

findInsertIndex(comparatorFn, [{id: 7}, {id: 8}], {id: 7});
// 1
```