var test = require('tape')
var webwrap = require('../dist/bundle.js')

var util = require('util')
var vm = require('vm')
var jsdom = require('jsdom')

var fs = require('fs')

var _argv = process.argv.slice(0, 2)

var html = '<body></body>'

function argv(args) {
  if (!Array.isArray(args)) {
    args = args.split(/\s+/)
  }
  return _argv.concat(args)
}

test('command line arguments', function (t) {
  t.test('without cli arguments []', function (t) {
    t.plan(3)
    var output = webwrap(argv(''))

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

  t.test('with leaky scripts [<files>...]', function (t) {
    t.plan(6)
    var output = webwrap(argv('test/file1.js test/file2.js'))

    var logs = []
    var virtualConsole = jsdom.createVirtualConsole()
    virtualConsole.on('log', function (log) {
      logs.push(log)
    })

    jsdom.env({ html: html, src: output, virtualConsole,
      done: function (err, window) {
        t.error(err)
        t.ok(window)

        t.deepEqual(logs, [
          'Tiny giraffes dancing ballet',
          '#1',
          '#2',
          '#3',
          'Rabid beavers with bazookas',
          'Giraffe',
          'window-var',
          'global-var'
        ], 'console.log logs match')
        t.notEqual(window.name, 'Giraffe', 'window.name was not leaked.')
        t.equal(window.windowVariable, undefined, 'windowVariable not leaked')
        t.equal(window.globalVariable, 'global-var', 'globalVariable leaked')
      }
    })
  })

  t.test('with leaky scripts [--disable-object-assign]', function (t) {
    t.plan(6)
    var output = webwrap(argv('--disable-object-assign test/file1.js test/file2.js'))

    var logs = []
    var virtualConsole = jsdom.createVirtualConsole()
    virtualConsole.on('log', function (log) {
      logs.push(log)
    })

    jsdom.env({ html: html, src: output, virtualConsole,
      done: function (err, window) {
        t.error(err)
        t.ok(window)

        t.deepEqual(logs, [
          'Tiny giraffes dancing ballet',
          '#1',
          '#2',
          '#3',
          'Rabid beavers with bazookas',
          'Giraffe',
          'window-var',
          'global-var'
        ], 'console.log logs match')
        t.notEqual(window.name, 'Giraffe', 'window.name was not leaked.')
        t.equal(window.windowVariable, undefined, 'windowVariable was not leaked')
        t.equal(window.globalVariable, 'global-var', 'globalVariable leaked')
      }
    })

    fs.writeFileSync('test/output.js', output)
  })

  // t.test('with leaky scripts [--disable-object-assign]', function (t) {
  //   t.plan(6)
  //   var output = webwrap(argv('--disable-object-assign test/file1.js test/file2.js'))

  //   var logs = []
  //   var virtualConsole = jsdom.createVirtualConsole()
  //   virtualConsole.on('log', function (log) {
  //     logs.push(log)
  //   })

  //   jsdom.env(html, { virtualConsole }, function (err, window) {
  //     t.error(err)
  //     t.ok(window)

  //     var script = new vm.Script(output)
  //     var context = new vm.createContext(window)
  //     script.runInContext(context)
  //     t.deepEqual(logs, [
  //       'Tiny giraffes dancing ballet',
  //       '#1',
  //       'Rabid beavers with bazookas',
  //       '#2',
  //       'Rabid beavers with bazookas',
  //       '#3',
  //       'Rabid beavers with bazookas',
  //       'Giraffe',
  //       'wow',
  //       undefined
  //     ], 'console.log logs match')
  //     t.equal(window.name, 'Giraffe', 'window.name was leaked.')
  //     t.equal(window.__penguinsInHighHeels, 'wow', 'window.__penguinsInHighHeels was leaked.')
  //     t.equal(window.__bearsWearingBandanasAndEatingIcecream, undefined, 'local __bearsWearingBandanasAndEatingIcecream was not leaked.')
  //   })
  // })

  t.test('with embed styles only [-s, --styles]', function (t) {
    t.plan(5)
    var output = webwrap(argv('-s test/style.css -s test/libs/bootstrap.min.css'))
    t.ok(output.indexOf('Large penguins hola-hooping on ice') > 0, 'style.css embedded')
    t.ok(output.indexOf('getbootstrap.com') > 0, 'bootstrap.min.css embedded')

    var virtualConsole = jsdom.createVirtualConsole()

    var logs = []
    virtualConsole.on('log', function (log) {
      logs.push(log)
    })

    jsdom.env(html, { virtualConsole }, function (err, window) {
      t.error(err)
      t.ok(window)

      var script = new vm.Script(output)
      var context = new vm.createContext(window)
      script.runInContext(context)
      t.deepEqual(logs, [], 'console.log messages match')
    })
  })
})
