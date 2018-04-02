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

      if ( target === 'scripts' ) {
        // var scope = detectGlobals( buffer )
        try {
          var scope = detectGlobals( buffer )

          detectionList.push( parseDetectionList( buffer, file, scope ) )

          if ( transformGlobals && !detectMode ) {
            buffer = getTransformedBufferFromScope(
              buffer,
              scope,
              function ( head, name, tail, identifier ) {
                // make sure to only transform recognied identifiers
                // and not named functions

                var leftMostCharacter = getLeftMostNonWhitespaceCharacter( head, head.length )
                var rightMostCharacter = getRightMostNonWhitespaceCharacter( tail, 1 )
                if ( rightMostCharacter === ',' || leftMostCharacter === ',' ) {
                  // ignore multi variable declarations
                  // don't transform/explicitly prepend context
                  // return ( `${ head }${ 'GIRAFFE' }${ tail }` )
                }

                if ( leftMostCharacter === ',' ) {
                  // special case with multi variable declarations
                  return ( `${ head }${ context }.${ name }${ tail }` )
                }

                var label = identifier && identifier.name || ''
                switch ( label ) {
                  case 'var':
                  case 'let':
                  case 'const':
                    head = head.slice( 0, -identifier.count )
                    break

                  case 'function':
                  default:
                    // don't transform/explicitly prepend context
                    return ( `${ head }${ name }${ tail }` )
                }

                // NOTE! semicolon ( ; ) and dot ( . ) between head, context and name
                return ( `${ head }\n;${ context }.${ name }${ tail }` )
              }
            )
          }
        } catch ( err ) {
          if ( !detectMode ) {
            var item = { err: err }
            var name = item.err.name || 'Error'
            var message = item.err.message || item.err.description || String( item.err )
            message = String( item.err )

            // console.error()
            // console.error( clc.black( ' -- parsing failed | webwrap @talmobi/lexical-scope -- ' ) )
            // console.error( 'SASD: ' + clc.cyan( item.file ) )
            console.error( err )
            console.error( 'file: ' + clc.cyan( item.file ) )
          }

          detectionList.push( parseDetectionError( buffer, file, err ) )
        }
      }

      buffers[target].push(buffer)
    })
  })

  if ( detectMode ) {
    var exitCode = 0 // success
    var notify = false

    if ( detectionList.length > 0 ) exitCode = 1

    detectionList.forEach( function ( logs ) {
      logs.forEach( function ( log ) {
        var type = log.type
        var args = log.args

        console[ type ].apply( this, args )
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

  return output

  // if (!!argv.output) {
  //   fs.writeFileSync(argv.output, output, 'utf8')
  //   console.error('webwrap written to: ' + argv.output)
  //   return undefined
  // } else {
  //   return output
  // }

  function getTransformedBufferFromScope ( buffer, scope, transform )
  {
    buffer = buffer.toString( 'utf8' )
    var scope = scope || {}

    var list = []

    // combine scopes into a single list
    // with name and position information

    var localKeys = scope.locals[ '' ] || []
    localKeys.forEach( function ( key ) {
      var node = scope._locals[ '' ][ key ]
      if ( node.id ) {
        var start = node.id.start
        var end = node.id.end
        var type = node.id.type
        var name = node.id.name

        if ( name === key ) {
          var item = {
            lexical: true,
            name: name,
            start: start,
            end: end
          }

          list.push( item )
        }
      }
    } )

    var exportedKeys = scope.globals.exported
    exportedKeys.forEach( function ( key ) {
      var node = scope.globals._exported[ key ]
      if ( node ) {
        var start = node.start
        var end = node.end
        var type = node.type
        var name = node.name

        if ( name === key ) {
          var item = {
            lexical: false,
            name: name,
            start: start,
            end: end
          }

          list.push( item )
        }
      }
    } )

    // sort the list by positions
    list.sort( function ( a, b ) {
      return a.start - b.start
    } )

    // NOTE!
    // transform buffer contents backwards
    // in order to keep position information in order
    list.reverse().forEach( function ( item ) {
      var head = buffer.slice( 0, item.start )
      var tail = buffer.slice( item.end )

      // handle preceding `var`, `let`, `const`
      var identifier = getIdentifier( buffer, item.start, item.end, item.name )

      // console.log( 'transformed: ' + item.name )
      buffer = transform( head, item.name, tail, identifier )
    } )

    return buffer
  }

  // first word like string before $name at $start-$end
  function getIdentifier ( text, start, end, name )
  {
    var identifier = ''

    var count = 0 // full traverse length including whitespace
    var word = ''
    for ( var i = start - 1; i >= 0; i-- ) {
      count++

      var c = text[ i ]
      var trimmed = c.trim()

      // don't construct across multiple lines
      if ( c === '\n' && word.length > 0 ) {
        // done, break out of loop
        break
      }

      if ( trimmed.length > 0 ) {
        // construct word backwards
        word = c + word
      } else { // whitespace character
        if ( word.length > 0 ) {
          // done, break out of loop
          break
        }
      }
    }

    identifier = word.trim()
    // console.log( 'getting identifier: ' + identifier )

    if ( identifier.length > 0 ) {
      return {
        name: identifier,
        start: start - count,
        end: start - count + identifier.length,
        count: count,

        target: {
          name: name,
          start: start,
          end: end
        }
      }
    }

    return undefined
  }

  function getRightMostNonWhitespaceCharacter ( text, position )
  {
    for ( var i = position; i < text.length; i++ ) {
      var c = text[ i ] || ''
      var trimmed = c.trim()

      if ( trimmed.length > 0 ) return c
    }

    return ''
  }

  function getLeftMostNonWhitespaceCharacter ( text, position )
  {
    for ( var i = position - 1; i >= 0; i-- ) {
      var c = text[ i ] || ''
      var trimmed = c.trim()

      if ( trimmed.length > 0 ) return c
    }

    return ''
  }

  function parseDetectionList ( text, filename, scope )
  {
    var list = []

    var console = {
      log: function ( ...args ) {
        list.push( { type: 'log', args: args } )
      },
      error: function ( ...args ) {
        list.push( { type: 'error', args: args } )
      }
    }

    console.log()
    console.log( clc.black( ' -- webwrap @talmobi/lexical-scope -- ' ) )
    console.log( 'file: ' + clc.cyan( filename ) )

    var localKeys = scope.locals[ '' ] || []
    localKeys.forEach( function ( key ) {
      var node = scope._locals[ '' ][ key ]

      if ( !argv[ 'detect-all' ] && webBuiltins[ key ] ) {
        // skip web builtins
        return
      }

      if ( node.id ) {
        var start = node.id.start
        var end = node.id.end
        var type = node.id.type
        var name = node.id.name

        // var label = clc.yellow( 'lexical' )
        var identifier = getIdentifier( text, start, end )
        identifier = identifier && identifier.name || ''

        var scopeType = clc.yellow( 'lexical' )
        var label = clc.yellowBright( name )
        var padding = generateWhitespace( 18 - ( 'lexical' + name ).length )

        // colorize identifier
        switch ( identifier ) {
          case 'function':
            identifier = clc.blue( identifier )
            break
          case 'var':
          case 'let':
          case 'const':
            identifier = clc.red( identifier.slice( 0, 3 ) )
          default:
            identifier = clc.black( identifier.slice( 0, 3 ) )
        }

        var span = (
          `  ${ scopeType } ${ label } ${ padding } [${ identifier }] (${ start }:${ end })`
        )

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

      if ( node ) {
        var start = node.start
        var end = node.end
        var type = node.type
        var name = node.name

        // var label = clc.magentaBright( 'export' )
        var identifier = getIdentifier( text, start, end )
        identifier = identifier && identifier.name || ''

        var scopeType = clc.magentaBright( ' export' )
        var label = clc.yellowBright( name )
        var padding = generateWhitespace( 18 - ( ' export' + name ).length )

        // colorize identifier
        switch ( identifier ) {
          case 'function':
            identifier = clc.blue( identifier )
            break
          case 'var':
          case 'let':
          case 'const':
            identifier = clc.red( identifier )
          default:
            identifier = clc.black( identifier )
        }

        var span = (
          `  ${ scopeType } ${ label } ${ padding } [${ identifier }] (${ start }:${ end })`
        )

        console.log( span )
      }
    } )

    return list
  }

  function parseDetectionError ( text, filename, err )
  {
    var list = []

    var console = {
      log: function ( ...args ) {
        list.push( { type: 'log', args: args } )
      },
      error: function ( ...args ) {
        list.push( { type: 'error', args: args } )
      }
    }

    var name = err.name || 'Error'
    var message = err.message || err.description || String( err )
    message = String( err )
    console.log( err )

    console.log()
    console.log( clc.black( ' -- detection error | webwrap @talmobi/lexical-scope -- ' ) )
    console.log( 'file: ' + clc.cyan( filename ) )

    if ( message.indexOf( name ) === 0 ) {
      name = ''
    } else {
      message = name + ': ' + message
      name = ''
    }

    // colorize words with Error in them
    message = (
      message
      .split( /\s+/ )
      .map( function ( word ) {
        if ( word.indexOf( 'Error' ) >= 0 ) {
          return clc.red( word )
        }
        return word
      } )
      .join( ' ' )
    )

    console.log(
      `${ name && name || '' }${ message } ${ filename }`
    )

    return list
  }

  function generateWhitespace ( count, character )
  {
    // default to single space
    if ( typeof character !== 'string' ) character = ' '

    var buffer = ''
    for ( var i = 0; i < count; i++ ) {
      buffer += character
    }

    return buffer
  }
}
