import jQuery from 'jquery';
(window as any).$ = jQuery;
(window as any).jQuery = jQuery;
console.log("import jquery", {jQuery, wjq: (window as any).jQuery});
export default jQuery;
