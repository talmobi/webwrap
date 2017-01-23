var test = require('tape')
var webwrap = require('../dist/bundle.js')

var util = require('util')
var vm = require('vm')
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
    t.plan(10)
    var output = webwrap(argv('--export lib --export redom test/libs/r*.js test/libs/jquery-3.1.1.min.js test/libs/bootstrap* test/style.css test/vendor.js test/script.js'))
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
        t.ok(window)
        t.deepEqual(logs, [
          'vendor: typeof window.jQuery: function',
          'vendor: typeof jQuery: function',
          'vendor: window === global: true',
          'vendor: typeof bestdog: Ada',
          'hello world',
          'typeof document: object',
          'typeof window: object',
          'window === global: true',
          'typeof say: function',
          'typeof window.say: function',
          'typeof lib: object',
          'typeof window.lib: object',
          'typeof window.React: object',
          'typeof window.redom: object',
          'typeof bestdog: Mollie',
          'hello, to my little friend',
          'webwrap: exporting [lib] from wrapped global.',
          'webwrap: exporting [redom] from wrapped global.'
        ]),
        t.equal(typeof window.say, 'undefined', 'global variable succesfully wrapped.') // check that it hasn't leaked
        t.equal(typeof window.React, 'undefined', 'global variable succesfully wrapped.') // check that it hasn't leaked
        t.equal(typeof window.lib, 'object', 'global variable succesfully exposed through ([--export lib] success)') // this is specifically exported
        t.equal(typeof window.redom, 'object', 'global variable succesfully exposed through ([--export redom] success)') // this is specifically exported
        t.equal(window.bestdog, 'Ada', 'global variable successfully restored to original') // this is specifically exported

        var app = window.document.getElementById('app')
        t.ok(app, 'div#app element found.')
        t.equal(app.innerHTML, 'hello, giraffe', 'div#app element content correct.')
      }
    })
  })
})
