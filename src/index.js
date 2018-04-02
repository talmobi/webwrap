'use strict'

var webBuiltins = require( __dirname + '/../src/builtin-objects.js' )

module.exports = function (argv) {
  argv = require('minimist')(argv.slice(2), {
    boolean: ['h', 'v', 'V', 'd', 'D', '1', 'T' ],
    alias: {
      'notransform': [ 'T', 'notrans' ],
      'exit-1': [ '1' ],
      'detect': [ 'd' ],
      'detect-all': [ 'D' ],
      'context': [ 'C' ], // global context key name
      'version': ['V'],
      'verbose': ['v'],
      'help': ['h'],
      'output': ['o'],
      'exports': ['x', 'export']
    }
  })

  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')

  var clc = require( 'cli-color' )

  // var detectGlobals = require( '../../acorn-globals/index.js' )
  // var detectGlobals = require( 'lexical-scope' )
  // var detectGlobals = require( '../../lexical-scope/index.js' )
  var detectGlobals = require( '@talmobi/lexical-scope' )

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
    , '    -x, --export                   Global variable to keep/export through'
    , '                                   to the true global object.'
    , ''
    , '    -v, --version                  Display version'
    , '    -h, --help                     Display help information (this text)'
    , ''
  ].join('\n');

  var verbose = (!!argv['verbose'] || !!argv['v'])

  if (!!argv['help'] || !!argv['h']) {
    console.error(usage)
    process.exit() // exit success
  }

  if (!!argv['version'] || !!argv['V']) {
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

  var detectionList = []
  var detectMode = argv[ 'detect' ] || argv[ 'detect-all' ]

  var transformGlobals = !argv[ 'notransform' ]

  var files = argv._ || []
  if (!Array.isArray(files)) files = [files]
  var _files = []
  files.forEach(function (file) {
    glob.sync(file).forEach(function (file) {
      var suffix = file.slice(file.lastIndexOf('.') + 1)

      var buffer
      try {
        buffer = fs.readFileSync(file, 'utf8')
      } catch ( err ) {
        if ( err.code === 'EISDIR' ) {
          // ignore
          return console.error( 'ignoring directory: ' + file )
        }
      }
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

  if ( detectMode ) {
    var exitCode = 0 // success
    var notify = false

    detectionList.forEach( function ( item ) {
      console.log()
      console.log( clc.black( ' -- webwrap @talmobi/lexical-scope -- ' ) )
      console.log( 'file: ' + clc.cyan( item.file ) )

      var scope = item.scope || {}

      var localKeys = scope.locals[ '' ] || []

      localKeys.forEach( function ( key ) {
        var node = scope._locals[ '' ][ key ]

        if ( !argv[ 'detect-all' ] && webBuiltins[ key ] ) {
          // skip web builtins
          return
        }

        exitCode = 1

        if ( node.id ) {
          var start = node.id.start
          var end = node.id.end
          var type = node.id.type
          var name = node.id.name

          var span = clc.red( '  lexical' ) + ' : ' + name
          span += ' (' + start + ':' + end + ')'

          console.log( span )
        }
      } )

      var exportedKeys = scope.globals.exported

      exportedKeys.forEach( function ( key ) {
        var node = scope.globals._exported[ key ]

        if ( !argv[ 'detect-all' ] && webBuiltins[ key ] ) {
          // skip web builtins
          return
        }

        exitCode = 1

        if ( node ) {
          var start = node.start
          var end = node.end
          var type = node.type
          var name = node.name

          var span = clc.yellow( '  export' ) + ' : ' + name
          span += ' (' + start + ':' + end + ')'

          console.log( span )
        }
      } )
    } )

    if ( notify ) {
      notify()
    }

    if ( argv[ 'exit-1' ] ) {
      process.exit( exitCode )
    } else {
      process.exit()
    }
  }

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
    ;(function (${ global }) {
      var window = ${ global }
      var ${ keysName } = {}
      Object.keys(window).forEach(function (key) {
        if (key.indexOf('webkit') === -1) {
          ${ keysName }[key] = window[key]
        }
      })

      ;(function () {
        var css = '${ cssText }'
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
          ${ jsText }
        }).call(global)
      })(window, window);

      ;(function () {
        // check for leaks
        var cache = {}
        var newKeys = Object.keys(window)

        Object.keys(window).forEach(function (key) {
          if (key.indexOf('webkit') === -1) { // skip deprecated attributes
            cache[key] = window[key] // cache it for potential exports
            if (!${ keysName }[key]) window[key] = undefined // remove leaked attribute
          }
        })

        Object.keys(${ keysName }).forEach(function (key) {
          if (window[key] !== ${ keysName }[key]) {
            window[key] = ${ keysName }[key] // restore overwritten attribute
          }
        })

        var exports = [${ exports }];
        exports.forEach(function (x) {
          if (${ verbose }) { console.log('webwrap: exporting [' + x + '] from wrapped global.') }
          window[x] = cache[x] // export attribute to the true global object
        })
        cache = undefined // put cache up for garbage collection
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
