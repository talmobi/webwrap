
    ;(function (global59bfa7a99552880) {
      var global = {}
      var window = global
      global.__proto__ = global59bfa7a99552880;

      var css = '';
      var head = document.head || document.getElementsByName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css))
      }
      head.appendChild(style)

      ;(function (global, window) {
          ;
              (function () { 'use strict';
                ;console.log('Tiny giraffes dancing ballet')
window.name = 'Giraffe'
window.windowVariable = 'window-var'
globalVariable = 'global-var'
;
              }).call(global)
            ,
              (function () { 'use strict';
                ;[1, 2, 3].forEach(function (item) {
  console.log('#' + item)
})
console.log('Rabid beavers with bazookas')
console.log(window.name)
console.log(window.windowVariable)
console.log(globalVariable)
;
              }).call(global)
            ;
      })(global, window);
    })(this);
  