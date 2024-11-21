# rc-new-window
---

React New Window Component to show content in a popup browser window.
Ported from [react-new-window](https://github.com/rmariuzzo/react-new-window)

[![NPM version][npm-image]][npm-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/rc-new-window.svg?style=flat-square
[npm-url]: http://npmjs.org/package/rc-new-window
[download-image]: https://img.shields.io/npm/dm/rc-new-window.svg?style=flat-square
[download-url]: https://npmjs.org/package/rc-new-window


## Development

```
npm install
npm start
```

## Example


online example: https://ticlo.github.io/rc-new-window/



## install

[![rc-new-window](https://nodei.co/npm/rc-new-window.png)](https://npmjs.org/package/rc-new-window)

## Usage

```js
import React from 'react';
import ReactDOM from 'react-dom';
import NewWindow from 'rc-new-window';

ReactDOM.render((
  <NewWindow>
    Content to show in the new window
  </NewWindow>
), container);
```

## API

### props

<table class="table table-bordered table-striped">
    <thead>
    <tr>
        <th style="width: 100px;">name</th>
        <th>type</th>
        <th>default</th>
        <th>description</th>
    </tr>
    </thead>
    <tbody>
        <tr>
          <td>url</td>
          <td>String</td>
          <td></td>
          <td>Use url instead of children content</td>
        </tr>
        <tr>
          <td>name</td>
          <td>String</td>
          <td></td>
          <td>Name of new window</td>
        </tr>
        <tr>
          <td>title</td>
          <td>String</td>
          <td>title of current window</td>
          <td>Title of new window</td>
        </tr>
        <tr>
          <td>copyStyles</td>
          <td>Boolean</td>
          <td>true</td>
          <td>Copy the styles from main window</td>
        </tr>
        <tr>
          <td>width</td>
          <td>Number</td>
          <td>640</td>
          <td>Window inner width</td>
        </tr>
        <tr>
          <td>height</td>
          <td>Number</td>
          <td>480</td>
          <td>Window inner height</td>
        </tr>
        <tr>
          <td>initPopupInnerRect</td>
          <td>Function</td>
          <td></td>
          <td>init the window client area<br/>return {left,top,width,height}</td>
        </tr>
        <tr>
          <td>initPopupOuterRect</td>
          <td>Function</td>
          <td></td>
          <td>init the window position and size<br/>return {left,top,width,height}</td>
        </tr>
        <tr>
          <td>top</td>
          <td>Number</td>
          <td>center of current window</td>
          <td>Window position</td>
        </tr>
        <tr>
          <td>onOpen</td>
          <td>(w: Window) => void</td>
          <td></td>
          <td>callback when window is opened</td>
        </tr>
        <tr>
          <td>onClose</td>
          <td>() => void</td>
          <td></td>
          <td>callback when window is closed</td>
        </tr>
        <tr>
          <td>onBlock</td>
          <td>() => void</td>
          <td></td>
          <td>callback when window.open failed</td>
        </tr>
    </tbody>
</table>


## License

rc-new-window is released under the Apache license version 2.0.
