(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var fs = require('fs');

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    'param': ['p', 'params'],
    'arg': ['a', 'args'],
    'context': ['c'],
    'styles': ['s', 'style'],
    'version': ['v'],
    'help': ['h']
  }
});

var usage = [
    ''
  , '  Usage: imprison [options] <file.js>... > output.js'
  , '    imprison -c window -p window -a \'Object.assign({}, window || {})\' <file.js>... > output.js'
  , '    imprison -c window -p window -a window <file.js>... > output.js'
  , ''
  , '  Options:'
  , ''
  , '    -p, --param <string>           Specify wrapper function parameter.'
  , '                                   (function (params...) {})(args...)'
  , ''
  , '    -a, --arg <string>             Specify wrapper function argument.'
  , '                                   (function (params...) {})(args...)'
  , ''
  , '                                   Plase note that parameters and arguments are'
  , '                                   passed in in the order used.'
  , ''
  , '    -c, --context <string>         Calling context (\'this\' by default)'
  , '                                   function.call(context || \'this\')'
  , ''
  , '    -s, --styles <string>          Css files to embed within the output.'
  , '                                   Styles are appended to document.head before'
  , '                                   scripts get initialized.'
  , ''
  , '    --disable-object-assign        Disable Object.assig wrapping of arguments.'
  , '                                   Object.assign({}, arg || {})'
  , ''
  , '    -v, --version                  Display version'
  , '    -h, --help                     Display help information (this text)'
  , ''
].join('\n');

if (!!argv['help'] || !!argv['h']) {
  console.error(usage);
  process.exit(); // exit success
}

if (!!argv['version'] || !!argv['v']) {
  var pjson = require('../package.json');
  var name = pjson['name'] || pjson['NAME'];
  var version = pjson['version'] || pjson['VERSION'];
  console.error(name + ' version: ' + version);
  process.exit(); // exit success
}

var params = argv.p || [];
var args = argv.a || [];
var context = argv.c || 'this';
var styles = argv.s;

if (!Array.isArray(argv)) { params = [params]; }
if (!Array.isArray(argv)) { args = [args]; }

if (!argv['disable-object-assign']) {
  args = args.map(function (arg) {
    if (arg.split(' ').length > 1) { return arg }
    return '(arg ? Object.assign({}, arg || {}) : arg)'.split('arg').join(arg)
  });
}

var scripts = argv._ || [];
if (!Array.isArray(scripts)) { scripts = [scripts]; }

if (!Array.isArray(styles)) { styles = [styles]; }

var buffers = {
  styles: [],
  scripts: []
};

scripts[0] && scripts.forEach(function (file) {
  // console.log('script file: ' + file)
  var buffer = fs.readFileSync(file, 'utf8');
  buffers.scripts.push(buffer);
});

styles[0] && styles.forEach(function (file) {
  // console.log('style file: ' + file)
  var buffer = fs.readFileSync(file, 'utf8');
  buffers.styles.push(buffer);
});

var polyfills = [
"\nif (typeof Object.assign != 'function') {\n  Object.assign = function (target, varArgs) { // .length of function is 2\n    'use strict';\n    if (target == null) { // TypeError if undefined or null\n      throw new TypeError('Cannot convert undefined or null to object');\n    }\n\n    var to = Object(target);\n\n    for (var index = 1; index < arguments.length; index++) {\n      var nextSource = arguments[index];\n\n      if (nextSource != null) { // Skip over if undefined or null\n        for (var nextKey in nextSource) {\n          // Avoid bugs when hasOwnProperty is shadowed\n          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {\n            to[nextKey] = nextSource[nextKey];\n          }\n        }\n      }\n    }\n    return to;\n  };\n}\n"
];

function UID () {
  return Date.now().toString(16).slice(-10) + String(Math.floor(Math.random() * (1 << 16)))
}

var _initFnName = '_initFnName' + UID();

// var cssText = buffers.styles.join(';').split('\'').join('"').split(/\s+/).join('')
var CleanCSS = require('clean-css');
var cssText = new CleanCSS().minify(buffers.styles.join('\n\n')).styles;

var output = (("\n  ;(function () {\n    ;" + (polyfills.join(';')) + ";\n\n    var css = '" + cssText + "';\n    var head = document.head || document.getElementsByName('head')[0];\n    var style = document.createElement('style');\n    style.type = 'text/css';\n    if (style.styleSheet) {\n      style.styleSheet.cssText = css;\n    } else {\n      style.appendChild(document.createTextNode(css))\n    }\n    head.appendChild(style)\n\n    ;(function (" + (params.join(',')) + ") {\n      var " + _initFnName + " = function () {\n        ;" + (buffers.scripts.join(';')) + ";\n      };\n      " + _initFnName + ".call(" + context + ")\n    })(" + (args.join(',')) + ");\n  })();\n"));

console.log(output);

})));
