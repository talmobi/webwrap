'use strict'

export default function (argv) {
  argv = require('minimist')(argv.slice(2), {
    boolean: ['h', 'v'],
    alias: {
      'context': ['c'],
      'version': ['v'],
      'help': ['h'],
      'output': ['o'],
      'exports': ['x', 'export']
    }
  })

  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')
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

  var context = argv.context || 'window'

  var exports = argv.exports || []
  if (!Array.isArray(exports)) exports = [exports]
  exports = exports.map(function (item) {
    return ('"' + String(item).split(/["']+/).join('') + '"')
  })

  var buffers = {
    styles: [],
    scripts: []
  }

  var files = argv._ || []
  if (!Array.isArray(files)) files = [files]
  var _files = []
  files.forEach(function (file) {
    glob.sync(file).forEach(function (file) {
      var suffix = file.slice(file.lastIndexOf('.') + 1)

      var buffer = fs.readFileSync(file, 'utf8')
      var target = 'scripts'

      switch (suffix) {
        case 'css':
          target = 'styles'
          break
        default: // assume javascript file
          target = 'scripts'
      }
      buffers[target].push(buffer)
    })
  })

  var UID = (function UID () {
    var counter = 0
    var size = (1 << 16)
    return function () {
      var date = Date.now().toString(16).slice(-10)
      var rnd = String(Math.floor(Math.random() * size))
      return ('uid' + date + String(counter++) + rnd)
    }
  })()

  var global = UID()
  var keysName = UID()

  var cssText = buffers.styles.join('\n\n').split(/[\r\n\t\v]+/).join(' ').split('\'').join('"')
  var jsText = buffers.scripts.join(';')

  var output = (`
    ;(function (${global}) {
      var window = ${global}
      var ${keysName} = {}
      Object.keys(window).forEach(function (key) {
        ${keysName}[key] = window[key]
      })

      ;(function () {
        var css = '${cssText}'
        var head = document.head || document.getElementsByName('head')[0]
        var style = document.createElement('style')
        style.type = 'text/css'
        if (style.styleSheet) {
          style.styleSheet.cssText = css
        } else {
          style.appendChild(document.createTextNode(css))
        }
        head.appendChild(style)
      })()

      ;(function (global, window) {
        ;(function () {
          ${buffers.scripts.map(function (buffer) {
            return buffer
          }).join(';')}
        }).call(global)
      })(window, window);

      ;(function () {
        // check for leaking
        var cache = {}
        var newKeys = Object.keys(window)

        Object.keys(window).forEach(function (key) {
          cache[key] = window[key]
          if (!${keysName}[key]) window[key] = undefined
        })

        Object.keys(${keysName}).forEach(function (key) {
          window[key] = ${keysName}[key]
        })

        var exports = [${exports}];
        exports.forEach(function (x) {
          console.error('exporting [' + x + '] from wrapped global.')
          window[x] = cache[x]
        })
      })()
    })(window || this);
  `)

  if (!!argv.output) {
    fs.writeFileSync(argv.output, output, 'utf8')
    console.error('webwrap written to: ' + argv.output)
    return undefined
  } else {
    return output
  }
}
