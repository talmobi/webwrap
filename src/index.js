var fs = require('fs')

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    'param': ['p', 'params'],
    'arg': ['a', 'args'],
    'context': ['c'],
    'styles': ['s', 'style'],
    'version': ['v'],
    'help': ['h']
  }
})

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
  console.error(usage)
  process.exit() // exit success
}

if (!!argv['version'] || !!argv['v']) {
  var pjson = require('../package.json')
  var name = pjson['name'] || pjson['NAME']
  var version = pjson['version'] || pjson['VERSION']
  console.error(name + ' version: ' + version)
  process.exit() // exit success
}

var params = argv.p || []
var args = argv.a || []
var context = argv.c || 'this'
var styles = argv.s

if (!Array.isArray(argv)) params = [params]
if (!Array.isArray(argv)) args = [args]

if (!argv['disable-object-assign']) {
  args = args.map(function (arg) {
    if (arg.split(' ').length > 1) return arg
    return '(arg ? Object.assign({}, arg || {}) : arg)'.split('arg').join(arg)
  })
}

var scripts = argv._ || []
if (!Array.isArray(scripts)) scripts = [scripts]

if (!Array.isArray(styles)) styles = [styles]

var buffers = {
  styles: [],
  scripts: []
}

scripts[0] && scripts.forEach(function (file) {
  // console.log('script file: ' + file)
  var buffer = fs.readFileSync(file, 'utf8')
  buffers.scripts.push(buffer)
})

styles[0] && styles.forEach(function (file) {
  // console.log('style file: ' + file)
  var buffer = fs.readFileSync(file, 'utf8')
  buffers.styles.push(buffer)
})

var polyfills = [
`
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
`
]

function UID () {
  return Date.now().toString(16).slice(-10) + String(Math.floor(Math.random() * (1 << 16)))
}

var _initFnName = '_initFnName' + UID()

// var cssText = buffers.styles.join(';').split('\'').join('"').split(/\s+/).join('')
var CleanCSS = require('clean-css')
var cssText = new CleanCSS().minify(buffers.styles.join('\n\n')).styles

var output = (`
  ;(function () {
    ;${polyfills.join(';')};

    var css = '${cssText}';
    var head = document.head || document.getElementsByName('head')[0];
    var style = document.createElement('style');
    style.type = 'text/css';
    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css))
    }
    head.appendChild(style)

    ;(function (${params.join(',')}) {
      var ${_initFnName} = function () {
        ;${buffers.scripts.join(';')};
      };
      ${_initFnName}.call(${context})
    })(${args.join(',')});
  })();
`)

console.log(output)
