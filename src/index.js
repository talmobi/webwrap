'use strict'

export default function (argv) {
  argv = require('minimist')(argv.slice(2), {
    boolean: ['h', 'v'],
    alias: {
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
    , '  Usage: webwrap [options] <files(js|css)>... > output.js'
    , ''
    , '  Sample: webwrap css/bundle.min.css js/vendors.min.js js/bundle.min.js > output.js'
    , ''
    , '  Options:'
    , ''
    , '    -o, --output                   Output file (stdout by default).'
    , ''
    , '    -x, --export                   Global variable to keep/export to'
    , '                                   the true global object.'
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
        if (key.indexOf('webkit') === -1) {
          ${keysName}[key] = window[key]
        }
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
          ${jsText}
        }).call(global)
      })(window, window);

      ;(function () {
        // check for leaking
        var cache = {}
        var newKeys = Object.keys(window)

        Object.keys(window).forEach(function (key) {
          if (key.indexOf('webkit') === -1) {
            cache[key] = window[key]
            if (!${keysName}[key]) window[key] = undefined
          }
        })

        Object.keys(${keysName}).forEach(function (key) {
          if (window[key] !== ${keysName}[key]) {
            window[key] = ${keysName}[key]
          }
        })

        var exports = [${exports}];
        exports.forEach(function (x) {
          console.log('webwrap: exporting [' + x + '] from wrapped global.')
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
