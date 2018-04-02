var test = require('tape')
var webwrap = require('../dist/bundle.js')

var util = require('util')
var jsdom = require('jsdom')

var fs = require('fs')

var _argv = process.argv.slice(0, 2)

var html = '<body></body>'

function argv(args) {
  if (!Array.isArray(args) && args) {
    args = args.split(/\s+/)
  }
  return args && _argv.concat(args) || _argv
}

test('command line arguments', function (t) {
  t.test('without cli arguments []', function (t) {
    t.plan(3)
    var output = webwrap(argv())

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
      argv( [
        '--verbose',
        '--export lib',
        '--export redom',
        '-x Cowbell',
        '-x UndeclaredGlobalObject',
        '-x UndeclaredGlobalFunction',
        // '-x luxon',
        'test/libs/r*.js',
        'test/libs/jquery-3.1.1.min.js',
        'test/libs/bootstrap*',
        'test/libs/undeclaredGlobalLibrary.js',
        'test/libs/luxon.min.js',
        'test/style.css',
        'test/vendor.js',
        'test/script.js'
      ].join( ' ' ) )
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

        t.equal( logs[ 24 ], 'webwrap: exporting [lib] from wrapped global.' )
        t.equal( logs[ 25 ], 'webwrap: exporting [redom] from wrapped global.' )
        t.equal( logs[ 26 ], 'webwrap: exporting [Cowbell] from wrapped global.' )
        t.equal( logs[ 27 ], 'webwrap: exporting [UndeclaredGlobalObject] from wrapped global.' )
        t.equal( logs[ 28 ], 'webwrap: exporting [UndeclaredGlobalFunction] from wrapped global.' )
        t.equal( logs[ 29 ], undefined )

        t.equal(typeof window.say, 'undefined', 'global variable succesfully wrapped.') // check that it hasn't leaked
        t.equal(typeof window.React, 'undefined', 'global variable succesfully wrapped.') // check that it hasn't leaked
        t.equal(typeof window.lib, 'object', 'global variable succesfully exposed through ([--export lib] success)') // this is specifically exported
        t.equal(typeof window.redom, 'object', 'global variable succesfully exposed through ([--export redom] success)') // this is specifically exported
        t.equal(typeof window.undeclaredGlobalVariable, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof undeclaredGlobalVariable, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof scopedGlobalFunction, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof scopedGlobalVariable, 'undefined', 'global variable successfully wrapped.')

        t.equal(typeof Foo, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof window.Foo, 'undefined', 'global variable successfully wrapped.')

        t.equal(typeof window.luxon, 'undefined', 'global variable successfully wrapped.')

        t.equal(typeof UndeclaredGlobalObject, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof UndeclaredGlobalFunction, 'undefined', 'global variable successfully wrapped.')
        t.equal(typeof Cowbell, 'undefined', 'global variable successfully wrapped.')

        t.equal(window.bestdog, 'Ada', 'global variable successfully restored to original') // this is specifically exported

        var app = window.document.getElementById('app')
        t.ok(app, 'div#app element found.')
        t.equal(app.innerHTML, 'hello, giraffe', 'div#app element content correct.')
        t.end()
      }
    })
  })
})
