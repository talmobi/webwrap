'use strict'

export default function (argv) {
  argv = require('minimist')(argv.slice(2), {
    boolean: ['disable-defaults', 'disable-object-assign', 'disable-polyfills', 'h', 'v'],
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
  })

  var fs = require('fs')
  var path = require('path')
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

  var context = argv.c

  if (!context) {
    if (!argv['disable-defaults']) {
      context = 'window'
    } else {
      context = 'this'
    }
  }

  var params = argv.params
  var args = argv.args
  if (!Array.isArray(argv)) params = [params]
  if (!Array.isArray(argv)) args = [args]

  if (!argv['disable-defaults']) {
    if (params.join(',').indexOf('window') === -1) params.push('window')
    if (args.join(',').indexOf('window') === -1) args.push('window')
  }
  args = args.filter(function (item) { return item })
  params = params.filter(function (item) { return item })

  if (!argv['disable-object-assign']) {
    args = args.map(function (arg) {
      return arg
      if (typeof arg !== 'string') return arg
      if (arg.split(' ').length > 1) return arg // wrap single words only
      return '(arg ? Object.assign({}, arg || {}) : arg)'.split('arg').join(arg)
    })
  }

  var scripts = argv._
  if (!Array.isArray(scripts)) scripts = [scripts]
  scripts = scripts.filter(function (item) { return item })

  var styles = argv.styles
  if (!Array.isArray(styles)) styles = [styles]
  styles = styles.filter(function (item) { return item })

  var buffers = {
    styles: [],
    scripts: []
  }

  scripts[0] && scripts.forEach(function (file) {
    // console.log('script file: ' + file)
    // file = path.join(__dirname, file)
    var buffer = fs.readFileSync(file, 'utf8')
    buffers.scripts.push(buffer)
  })

  styles[0] && styles.forEach(function (file) {
    // console.log('style file: ' + file)
    // file = path.join(__dirname, file)
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

  if (!!argv['disable-polyfills']) {
    polyfills = ['']
  }

  function UID () {
    return Date.now().toString(16).slice(-10) + String(Math.floor(Math.random() * (1 << 16)))
  }

  var globalName = 'global' + UID()
  var _initFnName = '_initFnName' + UID()

  var cssText = buffers.styles.join('\n\n').split(/[\r\n\t\v]/).join(' ').split('\'').join('"')

  var output = (`
    ;(function (${globalName}) {
      var global = {}
      var window = global
      global.__proto__ = ${globalName};

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

      ;(function (global, window) {
          ;${buffers.scripts.map(function (script) {
            return (`
              (function () { 'use strict';
                ;${script};
              }).call(global)
            `)
          })};
      })(global, window);
    })(this);
  `)

  if (!!argv.output) {
    fs.writeFileSync(argv.output, output, 'utf8')
    return ('webwrap written to: ' + argv.output)
  } else {
    return output
  }
}
