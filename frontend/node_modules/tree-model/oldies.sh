#!/bin/bash
set -e
tags=( v0.1.0 v0.2.0 v0.2.1 v0.2.2 v0.3.0 v0.4.0 v0.4.1 v0.4.2 v0.4.3 v1.0.0 v1.0.1 v1.0.2 v1.0.3 v1.0.4 v1.0.5 )
#tags=( v0.1.0 )
for tag in "${tags[@]}"
do
  rm -rf dist
  git checkout $tag
  mkdir -p dist
  index="index.js"
  if [ -f "src/TreeModel.js" ]
  then
    index="src/TreeModel.js"
  fi
  node_modules/.bin/browserify $index -o dist/TreeModel.js -s TreeModel 
  node_modules/.bin/uglifyjs dist/TreeModel.js > dist/TreeModel-min.js
  mkdir -p old/$tag
  cp dist/TreeModel*.js old/$tag/
  echo "Version $tag done"
done
