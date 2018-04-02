#!/usr/bin/env node

var fs = require( 'fs' )

// parse cli arguments
var argv = require( 'minimist' )(
  process.argv.slice( 2 ), {
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
  }
)

var output = require( './dist/bundle.js' )( process.argv )

// check for syntax error on output
var passlint = require( 'passlint' )
var ECMA2015 = 6
var errline = passlint( output, ECMA2015 )

if ( !!argv.output ) {
  fs.writeFileSync( argv.output, output, 'utf8' )
  console.error( 'webwrap written to: ' + argv.output )
} else {
  // print to stdout
  console.log( output )
}

// print syntax error warnings
if ( errline ) {
  var target = argv.output || 'stdout'
  console.error()
  console.error( ' == webwrap warning, syntax error found == ')
  console.error( target + ':' + errline )
}
