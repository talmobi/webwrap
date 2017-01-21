var test = require('tape')
var webwrap = require('../dist/bundle.js')

var util = require('util')
var vm = require('vm')
var jsdom = require('jsdom')

var _argv = process.argv.slice(0, 2)

function argv(args) {
  if (!Array.isArray(args)) {
    args = args.split(/\s+/)
  }
  return _argv.concat(args)
}

test('style embed with scripts', function (t) {
  t.plan(6)
  var output = webwrap(argv('-s test/style.css test/file1.js test/file2.js'))
  t.ok(output.indexOf('function') > 0, 'function found.')
  t.ok(output.indexOf('Tiny giraffes dancing ballet') > 0, 'file1.js embedded.')
  t.ok(output.indexOf('Rabid beavers with bazookas') > 0, 'file2.js embedded.')
  t.ok(output.indexOf('Large penguins hola-hooping on ice') > 0, 'style.css embedded')

  var html = '<body></body'
  var virtualConsole = jsdom.createVirtualConsole()

  var messages = []
  virtualConsole.on('log', function (msg) {
    messages.push(msg)
  })

  jsdom.env(html, { virtualConsole }, function (err, window) {
    var script = new vm.Script(output)
    var context = new vm.createContext(window)
    script.runInContext(context)
    t.deepEqual(messages, [
      'Tiny giraffes dancing ballet',
      '#1',
      'Rabid beavers with bazookas',
      '#2',
      'Rabid beavers with bazookas',
      '#3',
      'Rabid beavers with bazookas',
      'Giraffe'
    ], 'console.log messages match')
    t.notEqual(window.name, 'Giraffe', 'window.name was not leaked.')
  })
})

test('style embed with scripts', function (t) {
  t.plan(6)
  var output = webwrap(argv('--disable-object-assign -s test/style.css test/file1.js test/file2.js'))
  t.ok(output.indexOf('function') > 0, 'function found.')
  t.ok(output.indexOf('Tiny giraffes dancing ballet') > 0, 'file1.js embedded.')
  t.ok(output.indexOf('Rabid beavers with bazookas') > 0, 'file2.js embedded.')
  t.ok(output.indexOf('Large penguins hola-hooping on ice') > 0, 'style.css embedded')

  var html = '<body></body'
  var virtualConsole = jsdom.createVirtualConsole()

  var messages = []
  virtualConsole.on('log', function (msg) {
    messages.push(msg)
  })

  jsdom.env(html, { virtualConsole }, function (err, window) {
    var script = new vm.Script(output)
    var context = new vm.createContext(window)
    script.runInContext(context)
    t.deepEqual(messages, [
      'Tiny giraffes dancing ballet',
      '#1',
      'Rabid beavers with bazookas',
      '#2',
      'Rabid beavers with bazookas',
      '#3',
      'Rabid beavers with bazookas',
      'Giraffe'
    ], 'console.log messages match')
    t.equal(window.name, 'Giraffe', 'window.name was leaked.')
  })
})

// test('output evaluation', function (t) {
//   t.plan(4)
//   var output = webwrap(argv('-s style.css app.js module.js'))
//   t.ok(output.indexOf('function') > 0, 'function found.')
//   t.ok(output.indexOf('Tiny giraffes dancing ballet') > 0, 'file1.js embedded.')
//   t.ok(output.indexOf('Rabid beavers with bazookas') > 0, 'file2.js embedded.')
//   t.ok(output.indexOf('Large penguins hola-hooping on ice') > 0, 'style.css embedded')
// })
