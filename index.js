var fs = require('fs')

var argv = require('minimist')(process.argv.slice(2))

var params = argv.p || []
var args = argv.a || []
var context = argv.c || ''

if (!Array.isArray(argv)) params = [params]
if (!Array.isArray(argv)) args = [args]

var files = argv._ || []
if (!Array.isArray(files)) files = [files]

var fnName = '__' + Date.now()

var buffers = []
files.forEach(function (file) {
  var buffer = fs.readFileSync(file, 'utf8')
  buffers.push(buffer)
})

var str = [
  ';(function (' + params.join(',') + ') {',
      'var ' + fnName + ' = function () {',
          buffers.join(';'),
        '}',
    ';' + fnName + '.call(' + context + ')',
  '})(' + args.join(',') + ');',
].join('')

console.log(str)
