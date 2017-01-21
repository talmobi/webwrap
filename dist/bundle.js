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
    'help': ['h'],
    'output': ['o'],
    'disable-defaults': ['disable-default'],
    'disable-polyfills': ['disable-polyfill'],
  }
});

var usage = [
    ''
  , '  Usage: webwrap [options] <file.js>... > output.js'
  , '    webwrap [options] <file.js>... --output output.js'
  , '    webwrap -c window -p window -a \'Object.assign({}, window || {})\' <file.js>... > output.js'
  , '    webwrap -c window -p window -a window <file.js>... > output.js'
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
  , '    -c, --context <string>         Calling context.'
  , '                                   wrapperInitFunction.call(context || \'this\')'
  , '                                   \'window\' by default'
  , '                                   \'this\' by default with --disable-defaults flag'
  , ''
  , '    -s, --styles <file>            Css files to embed within the output.'
  , '                                   Styles are appended to document.head before'
  , '                                   scripts get initialized.'
  , ''
  , '    --disable-polyfills            Disable polyfills (Object.assign polyfill)'
  , ''
  , '    --disable-object-assign        Disable Object.assign wrapping of truthy arguments.'
  , '                                   Object.assign({}, arg || {})'
  , ''
  , '    --disable-defaults             Disable \'window\' as a default parameter, argument,'
  , '                                   and context.'
  , '                                   webwrap -c window -p window -a window'
  , ''
  , '    -o, --output                   Output file (stdout by default).'
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
var context = argv.c;
var styles = argv.s;

if (!context) {
  if (!argv['disable-defaults']) {
    context = 'window';
  } else {
    context = 'this';
  }
}

if (!Array.isArray(argv)) { params = [params]; }
if (!Array.isArray(argv)) { args = [args]; }

if (!argv['disable-defaults']) {
  params.push('window');
  args.push('window');
}

if (!argv['disable-object-assign']) {
  args = args.map(function (arg) {
    if (arg.split(' ').length > 1) { return arg } // wrap single words only
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

if (!!argv['disable-polyfills']) {
  polyfills = [''];
}

function UID () {
  return Date.now().toString(16).slice(-10) + String(Math.floor(Math.random() * (1 << 16)))
}

var _initFnName = '_initFnName' + UID();

var cssText = buffers.styles.join('\n\n').split(/[\r\n\t\v]/).join(' ').split('\'').join('"');

var output = (("\n  ;(function () {\n    ;" + (polyfills.join(';')) + ";\n\n    var css = '" + cssText + "';\n    var head = document.head || document.getElementsByName('head')[0];\n    var style = document.createElement('style');\n    style.type = 'text/css';\n    if (style.styleSheet) {\n      style.styleSheet.cssText = css;\n    } else {\n      style.appendChild(document.createTextNode(css))\n    }\n    head.appendChild(style)\n\n    ;(function (" + (params.join(',')) + ") {\n      var " + _initFnName + " = function () {\n        ;" + (buffers.scripts.join(';')) + ";\n      };\n      " + _initFnName + ".call(" + context + ")\n    })(" + (args.join(',')) + ");\n  })();\n"));

if (!!argv.output) {
  fs.writeFileSync(argv.output, output, 'utf8');
} else {
  console.log(output);
}

})));
