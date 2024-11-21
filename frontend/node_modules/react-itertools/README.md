# React Itertools

<blockquote>A suite of tools for manipulating React children</blockquote>

<br />

<a href="https://www.npmjs.com/package/react-itertools">
  <img src="https://img.shields.io/npm/v/react-itertools.svg">
</a>
<a href="https://github.com/tatethurston/react-itertools/blob/master/LICENSE">
  <img src="https://img.shields.io/npm/l/react-itertools.svg">
</a>
<a href="https://bundlephobia.com/result?p=react-itertools">
  <img src="https://img.shields.io/bundlephobia/minzip/react-itertools">
</a>
<a href="https://www.npmjs.com/package/react-itertools">
  <img src="https://img.shields.io/npm/dy/react-itertools.svg">
</a>
<a href="https://github.com/tatethurston/react-itertools/actions/workflows/ci.yml">
  <img src="https://github.com/tatethurston/react-itertools/actions/workflows/ci.yml/badge.svg">
</a>

## What is this? 🧐

A suite of tools for manipulating React children: `each`, `filter`, `find`, `groupBy`, `map`, `reduce`.

`React.Children.map` and `React.Children.forEach` provided by the [React Children API](https://reactjs.org/docs/react-api.html#reactchildren) iterate shallowly. The utilities in this library will descend the child tree and visit every child.

## Installation & Usage 📦

1. Add this package to your project:
   - `yarn add react-itertools`

Just trying things out or want to skip the build step? Use the unpkg URL:

```
<script src="https://unpkg.com/react-itertools/dist/index.production.js"></script>
```

## Example

[Try the CodeSandbox Example!](https://codesandbox.io/s/flamboyant-nightingale-yvirv?file=/src/App.js)

```jsx
import { map } from "react-itertools";
import { isValidElement } from "react";

const MapExample = ({ children }) => {
  const fn = (el) => {
    return (
      <div
        style={{
          border: "1px solid black",
          padding: "10px",
          backgroundColor: "blanchedalmond",
        }}
      >
        {isValidElement(el) && el.props.children}
      </div>
    );
  };
  return <>{map(children, fn)}</>;
};

export default function App() {
  return (
    <>
      <p>
        `map` recursively iterates through all `children` and returns the
        transformed result of applying `fn` to each child.
      </p>
      <p>Recurses depth first, post-order.</p>
      <MapExample>
        <div>
          <div>
            <div />
            <div />
          </div>
          <div>
            <div />
            <div />
          </div>
        </div>
      </MapExample>
    </>
  );
}
```

## Highlights

🎁 Zero run time dependencies

🦶 [Small footprint](https://bundlephobia.com/result?p=react-itertools)

🌲 Tree shakeable

## Contributing 👫

PR's and issues welcomed! For more guidance check out [CONTRIBUTING.md](https://github.com/tatethurston/react-itertools/blob/master/CONTRIBUTING.md)

## Licensing 📃

See the project's [MIT License](https://github.com/tatethurston/react-itertools/blob/master/LICENSE).

```

```
