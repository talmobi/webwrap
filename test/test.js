var test = require('tape')
var webwrap = require('../dist/bundle.js')

var util = require('util')
var jsdom = require('jsdom')

var fs = require('fs')

var _argv = process.argv.slice(0, 2)

var html = '<body></body>'

var pkgjson = require( '../package.json' )


function parseProgram ( argv ) {
  // clear commander cache ( start from clean slate )
  delete require.cache[ require.resolve( 'commander' ) ]

  var program = require( 'commander' )

  program
  .version( pkgjson.name + ' ' + pkgjson.version )
  .usage( 'webwrap [options] <file ...>' )
  .option( '-I, --no-infect', 'disable implicit global infections' )
  .option( '-1, --exit-1', 'exit with error code 1 on errors' )
  .option( '-d, --detect', 'detect and report implicit globals only' )
  .option( '-C, --context <name>', 'global context key name, defaults to `window`' )
  .option( '-v, --verbose', 'verbose output, -v, -vv', increaseVerbosity, 0 )
  .option( '-o, --output <file>', 'output file ( stdout by default )' )
  .option( '-x, --export [name]', 'print help text', addExport, [] )
  .on( '--help', function () {
    console.log( '' )
    console.log( '  Examples:' )
    console.log( '' )
    console.log( '    $ webwrap css/bundle.min.css js/vendors.min.js js/bundle.min.js > output.js' )
    console.log( '    $ webwrap -x Highcharts -x moment -x React vendor/** -o output.js' )
    console.log( '' )
  } )
  .parse( _argv.concat( argv ) )

  if ( program.exit1 ) process.exitCode = 1

  if ( typeof program.format !== 'string' ) program.format = 'iife'
  program.format = program.format.toLowerCase()

  // don't use the implicit program.name() function
  if ( typeof program.name !== 'string' ) program.name = ''

  program.context = program.context || 'window'

  function increaseVerbosity ( v, total ) {
    return total + 1
  }

  function addExport ( val, list ) {
    list.push( val )
    return list
  }

  return program
}

test('command line arguments', function (t) {
  t.test('without cli arguments []', function (t) {
    t.plan(3)

    var output = webwrap( parseProgram( [] ) )

    var logs = []
    var virtualConsole = jsdom.createVirtualConsole()
    virtualConsole.on('log', function (log) {
      logs.push(log)
    })

    jsdom.env({ html: html, src: output, virtualConsole,
      done: function (err, window) {
        t.error(err)
        t.ok(window)
        t.deepEqual(logs, [])
      }
    })
  })

  t.test('with basic setup', function (t) {
    var output = webwrap(
      parseProgram( [
        '--verbose',
        '--export lib',
        '--export redom',
        '-x Cowbell',
        '-x UndeclaredGlobalObject',
        '-x UndeclaredScopedNamedFunction',
        '-x UndeclaredGlobalOnlyShownToScript',
        '-x UndeclaredGlobalNamedFunction',
        // '-x luxon',
        'test/libs/r*.js',
        'test/libs/jquery-3.1.1.min.js',
        'test/libs/bootstrap*',
        'test/libs/undeclaredGlobalLibrary.js',
        'test/libs/luxon.min.js',
        'test/style.css',
        'test/vendor.js',
        'test/script.js'
      ].join( ' ' ).split( ' ' ) )
    )

    fs.writeFileSync('test/output.js', output)

    var logs = []
    var virtualConsole = jsdom.createVirtualConsole()
    virtualConsole.on('log', function (log) {
      logs.push(log)
    })

    var preoutput = 'bestdog = "Ada"'
    jsdom.env({ html: html, src: [preoutput, output], virtualConsole,
      done: function (err, window) {
        t.error(err)
        t.ok(window, 'window ok' )

        // vendor.js
        t.equal( logs[ 0 ], 'vendor: typeof window.jQuery: function' )
        t.equal( logs[ 1 ], 'vendor: typeof jQuery: function' )
        t.equal( logs[ 2 ], 'vendor: window === global: true' )
        t.equal( logs[ 3 ], 'vendor: typeof bestdog: Ada' )

        // script.js
        t.equal( logs[ 4 ], 'hello world' )
        t.equal( logs[ 5 ], 'typeof document: object' )
        t.equal( logs[ 6 ], 'typeof window: object' )
        t.equal( logs[ 7 ], 'window === global: true' )
        t.equal( logs[ 8 ], 'window.undeclaredGlobalVariable === "Mollie": true' )
        t.equal( logs[ 9 ], 'typeof say: function' )
        t.equal( logs[ 10 ], 'typeof window.say: function' )
        t.equal( logs[ 11 ], 'typeof lib: object' )
        t.equal( logs[ 12 ], 'typeof window.lib: object' )
        t.equal( logs[ 13 ], 'typeof window.React: object' )
        t.equal( logs[ 14 ], 'typeof window.redom: object' )
        t.equal( logs[ 15 ], 'typeof bestdog: Mollie' )

        t.equal( logs[ 16 ], 'Cowbell: 16' )
        t.equal( logs[ 17 ], 'UndeclaredGlobalObject: muumi' )

        t.equal( logs[ 18 ], 'scopedGlobalVariable: 42' )
        t.equal( logs[ 19 ], 'hello, to my little friend' )

        t.equal( logs[ 20 ], 'UndeclaredGlobalOnlyShownToScript: foo' )
        t.equal( logs[ 21 ], 'typeof luxon: object' )

        t.equal( logs[ 22 ], 'typeof seafood: number' )
        t.equal( logs[ 23 ], 'typeof seabar: number' )

        t.equal( logs[ 24 ], 'webwrap: exporting [lib] type: object' )
        t.equal( logs[ 25 ], 'webwrap: exporting [redom] type: object' )
        t.equal( logs[ 26 ], 'webwrap: exporting [Cowbell] type: function' )
        t.equal( logs[ 27 ], 'webwrap: exporting [UndeclaredGlobalObject] type: object' )
        t.equal( logs[ 28 ], 'webwrap: exporting [UndeclaredScopedNamedFunction] type: undefined' )
        t.equal( logs[ 29 ], 'webwrap: exporting [UndeclaredGlobalOnlyShownToScript] type: string' )
        t.equal( logs[ 30 ], 'webwrap: exporting [UndeclaredGlobalNamedFunction] type: function' )
        t.equal( logs[ 31 ], undefined )

        t.equal(typeof window.say, 'undefined', 'global variable succesfully wrapped.') // check that it hasn't leaked
        t.equal(typeof window.React, 'undefined', 'global variable succesfully wrapped.') // check that it hasn't leaked
        t.equal(typeof window.lib, 'object', 'global variable succesfully exposed through ([--export lib] success)') // this is specifically exported
        t.equal(typeof window.redom, 'object', 'global variable succesfully exposed through ([--export redom] success)') // this is specifically exported
        t.equal(typeof window.undeclaredGlobalVariable, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof window.undeclaredGlobalVariable, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof window.scopedGlobalFunction, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof window.scopedGlobalVariable, 'undefined', 'global variable successfully wrapped.')

        t.equal(typeof window.Foo, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof window.Foo, 'undefined', 'global variable successfully wrapped.')

        t.equal(typeof window.luxon, 'undefined', 'global variable successfully wrapped.')

        t.equal(typeof window.UndeclaredGlobalObject, 'object', 'global variable successfully exported.')
        t.equal(typeof window.UndeclaredScopedNamedFunction, 'undefined', 'global variable successfully wrapped even when trying to export.')
        t.equal(typeof window.Cowbell, 'function', 'global variable successfully exported.')

        t.equal(window.bestdog, 'Ada', 'global variable successfully restored to original') // this is specifically exported

        var app = window.document.getElementById('app')
        t.ok(app, 'div#app element found.')
        t.equal(app.innerHTML, 'hello, giraffe', 'div#app element content correct.')
        t.end()
      }
    })
  })
})
