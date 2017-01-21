
    ;(function () {
      ;
  if (typeof Object.assign != 'function') {
    Object.assign = function (target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
  ;

      var css = 'html {   background: #222;   color: #eee; }  body {   margin: 0;   padding: 0;   font: "Giraffe", sans-serif; } ';
      var head = document.head || document.getElementsByName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';
      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css))
      }
      head.appendChild(style)

      ;(function (window) {
        var _initFnName59bea7edfe1940 = function () {
          ;console.log('Tiny giraffes dancing ballet')
window.name = 'Giraffe'
;[1, 2, 3].forEach(function (item) {
  console.log('#' + item)
})
console.log(window.name)
;
        };
        _initFnName59bea7edfe1940.call(window)
      })((window ? Object.assign({}, window || {}) : window));
    })();
  