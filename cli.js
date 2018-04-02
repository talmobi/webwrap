#!/usr/bin/env node

var fs = require( 'fs' )

var program = require( 'commander' )

var pkgjson = require( './package.json' )

// TODO refactor arg parsing and use same in tests?
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
.parse( process.argv )

program.context = program.context || 'window'

function increaseVerbosity ( v, total ) {
  return total + 1
}

function addExport ( val, list ) {
  list.push( val )
  return list
}

var output = require( './dist/bundle.js' )( program )

// check for syntax error on output
var passlint = require( 'passlint' )
var ECMA2015 = 6
var errline = passlint( output, ECMA2015 )

if ( program.output ) {
  fs.writeFileSync( program.output, output, 'utf8' )
  console.error( 'webwrap written to: ' + program.output )
} else {
  // print to stdout
  console.log( output )
}

// print syntax error warnings
if ( errline ) {
  var target = program.output || 'stdout'
  console.error()
  console.error( ' == webwrap warning, syntax error found == ')
  console.error( target + ':' + errline )
}
