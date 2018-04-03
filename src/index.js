'use strict'

var webBuiltins = require( __dirname + '/../src/builtin-objects.js' )

module.exports = function ( program ) {
  var fs = require('fs')
  var path = require('path')
  var glob = require('glob')

  var clc = require( 'cli-color' )

  // var detectGlobals = require( '../../acorn-globals/index.js' )
  // var detectGlobals = require( 'lexical-scope' )
  // var detectGlobals = require( '../../lexical-scope/index.js' )
  var detectGlobals = require( '@talmobi/lexical-scope' )

  var _exports = program.export || []

  _exports = _exports.map(function (item) {
    return ('"' + String(item).split(/["']+/).join('') + '"')
  })

  var buffers = {
    styles: [],
    scripts: []
  }

  var detectionList = []

  var files = program.args || []
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

          if ( !program.noInfect && !program.detect ) {
            buffer = getContextInfectedBufferFromScope(
              buffer,
              scope,
              program.context
            )
          }
        } catch ( err ) {
          if ( !program.detect ) {
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

  if ( program.detect ) {
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

    if ( program.exit1 ) {
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
            // restore overwritten attribute from original
            window[key] = ${ keysName }[key]
          }
        })

        var _exports = [${ _exports }]

        if ( ${ program.exportAll } ) {
          Object.keys( cache ).forEach( function ( key ) {
            if ( ${ keysName }.hasOwnProperty( key ) ) {
              // ignore
            } else {
              // add it to the _exports list
              _exports.push( key )
            }
          } )
        }

        // remove duplicates from _exports, only affects --verbose output
        // should not be duplicates unless --export-all and --export are both used as cli arguments
        // or the same key is --export'ed multiple times
        _exports = _exports.filter( function ( val, ind, arr ) {
          return ( arr.indexOf( val ) === ind )
        } )

        _exports.forEach(function (x) {
          var xport = cache[x]
          if (${ program.verbose }) { console.log('webwrap: exporting [' + x + '] type: ' + ( typeof xport ) ) }
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

  function getContextInfectedBufferFromScope ( buffer, scope, context )
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

    var script = ''
    var verboseScript = ''

    list.forEach( function ( item ) {
      var name = item.name

      // handle preceding `var`, `let`, `const`
      var identifier = getIdentifier( buffer, item.start, item.end, item.name )

      script += `\n;${ context }[ '${ name }' ] = ${ name };`

      verboseScript += `\n;console.log( 'webwrap: infecting ${ context }[${ name }], type: ' + ( typeof ${ name }) );`
    } )

    // add context infection script
    // expose all variables to the context scope
    buffer += (`
      ;(function () {
      /* webwrap context infection script */
      ${ script }
      })();
    `)

    if ( program.verbose >= 2 ) {
      // add infection reports
      buffer += (`
        ;(function () {
        /* webwrap verbosity: -vv  */
        ${ verboseScript }
        })();
      `)
    }

    return buffer
  }

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

      if ( webBuiltins[ key ] ) {
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

      if ( webBuiltins[ key ] ) {
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
