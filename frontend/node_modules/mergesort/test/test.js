/* global describe, it */

var chai, assert, mergeSort;
chai = require('chai');
mergeSort = require('..');
assert = chai.assert;
chai.Assertion.includeStack = true;

describe('mergeSort', function () {
  'use strict';

  it('should stable sort the array according to the comparator', function () {
    var originalArray, sortedArray, comparatorFn;

    comparatorFn = function (a, b) {
      return b.id - a.id;
    };

    originalArray = [
      {id: 122, stable: 1},
      {id: 121, stable: 1},
      {id: 121, stable: 2},
      {id: 121, stable: 3},
      {id: 121, stable: 4},
      {id: 121, stable: 5},
      {id: 121, stable: 6},
      {id: 121, stable: 7},
      {id: 121, stable: 8},
      {id: 121, stable: 9},
      {id: 121, stable: 10},
      {id: 121, stable: 11},
      {id: 121, stable: 12},
      {id: 121, stable: 13},
      {id: 121, stable: 14},
      {id: 121, stable: 15},
      {id: 122, stable: 2}
    ];

    sortedArray = mergeSort(comparatorFn, originalArray);

    assert.lengthOf(sortedArray, 17);
    assert.deepEqual(sortedArray, [
      {id: 122, stable: 1},
      {id: 122, stable: 2},
      {id: 121, stable: 1},
      {id: 121, stable: 2},
      {id: 121, stable: 3},
      {id: 121, stable: 4},
      {id: 121, stable: 5},
      {id: 121, stable: 6},
      {id: 121, stable: 7},
      {id: 121, stable: 8},
      {id: 121, stable: 9},
      {id: 121, stable: 10},
      {id: 121, stable: 11},
      {id: 121, stable: 12},
      {id: 121, stable: 13},
      {id: 121, stable: 14},
      {id: 121, stable: 15}
    ]);
  });

  it('should return a new array even if no sorting is needed.', function () {
    var arr0, arr1, arr2, comparatorFn;

    comparatorFn = function (a, b) {
      return a - b;
    };

    arr0 = [];
    arr1 = [1];
    arr2 = [1, 2];
    assert.notEqual(mergeSort(comparatorFn, arr2), arr2);
    assert.notEqual(mergeSort(comparatorFn, arr1), arr1);
    assert.notEqual(mergeSort(comparatorFn, arr0), arr0);

    assert.deepEqual(mergeSort(comparatorFn, arr2), arr2);
    assert.deepEqual(mergeSort(comparatorFn, arr1), arr1);
    assert.deepEqual(mergeSort(comparatorFn, arr0), arr0);
  });
});
