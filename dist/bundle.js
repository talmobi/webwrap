'use strict';

var index = function (argv) {
  argv = require('minimist')(argv.slice(2), {
    boolean: ['h', 'v'],
    alias: {
      'context': ['c'],
      'version': ['v'],
      'help': ['h'],
      'output': ['o'],
      'exports': ['x', 'export']
    }
  });

  var fs = require('fs');
  var path = require('path');
  var glob = require('glob');
  var usage = [
      ''
    , '  Usage: webwrap [options] <file.js>... > output.js'
    , '    webwrap [options] <file.js>... --output output.js'
    , '    webwrap -c window -p window -a \'Object.assign({}, window || {})\' <file.js>... > output.js'
    , '    webwrap -c window -p window -a window <file.js>... > output.js'
    , ''
    , '  Options:'
    , ''
    , '    -p, --param <string>           Specify wrapper function parameter.'
    , '                                   (function (params...) {})(args...)'
    , ''
    , '    -a, --arg <string>             Specify wrapper function argument.'
    , '                                   (function (params...) {})(args...)'
    , ''
    , '                                   Plase note that parameters and arguments are'
    , '                                   passed in in the order used.'
    , ''
    , '    -c, --context <string>         Calling context.'
    , '                                   wrapperInitFunction.call(context || \'this\')'
    , '                                   \'window\' by default'
    , '                                   \'this\' by default with --disable-defaults flag'
    , ''
    , '    -s, --styles <file>            Css files to embed within the output.'
    , '                                   Styles are appended to document.head before'
    , '                                   scripts get initialized.'
    , ''
    , '    --disable-polyfills            Disable polyfills (Object.assign polyfill)'
    , ''
    , '    --disable-object-assign        Disable Object.assign wrapping of truthy arguments.'
    , '                                   Object.assign({}, arg || {})'
    , ''
    , '    --disable-defaults             Disable \'window\' as a default parameter, argument,'
    , '                                   and context.'
    , '                                   webwrap -c window -p window -a window'
    , ''
    , '    -o, --output                   Output file (stdout by default).'
    , ''
    , '    -v, --version                  Display version'
    , '    -h, --help                     Display help information (this text)'
    , ''
  ].join('\n');

  if (!!argv['help'] || !!argv['h']) {
    console.error(usage);
    process.exit(); // exit success
  }

  if (!!argv['version'] || !!argv['v']) {
    var pjson = require('../package.json');
    var name = pjson['name'] || pjson['NAME'];
    var version = pjson['version'] || pjson['VERSION'];
    console.error(name + ' version: ' + version);
    process.exit(); // exit success
  }

  var context = argv.context || 'window';

  var exports = argv.exports || [];
  if (!Array.isArray(exports)) { exports = [exports]; }
  exports = exports.map(function (item) {
    return ('"' + String(item).split(/["']+/).join('') + '"')
  });

  var buffers = {
    styles: [],
    scripts: []
  };

  var files = argv._ || [];
  if (!Array.isArray(files)) { files = [files]; }
  var _files = [];
  files.forEach(function (file) {
    glob.sync(file).forEach(function (file) {
      var suffix = file.slice(file.lastIndexOf('.') + 1);

      var buffer = fs.readFileSync(file, 'utf8');
      var target = 'scripts';

      switch (suffix) {
        case 'css':
          target = 'styles';
          break
        default: // assume javascript file
          target = 'scripts';
      }
      buffers[target].push(buffer);
    });
  });

  var UID = (function UID () {
    var counter = 0;
    var size = (1 << 16);
    return function () {
      var date = Date.now().toString(16).slice(-10);
      var rnd = String(Math.floor(Math.random() * size));
      return ('uid' + date + String(counter++) + rnd)
    }
  })();

  var global = UID();
  var keysName = UID();

  var cssText = buffers.styles.join('\n\n').split(/[\r\n\t\v]+/).join(' ').split('\'').join('"');
  var jsText = buffers.scripts.join(';');

  var output = (("\n    ;(function (" + global + ") {\n      var window = " + global + "\n      var " + keysName + " = {}\n      Object.keys(window).forEach(function (key) {\n        " + keysName + "[key] = window[key]\n      })\n\n      ;(function () {\n        var css = '" + cssText + "'\n        var head = document.head || document.getElementsByName('head')[0]\n        var style = document.createElement('style')\n        style.type = 'text/css'\n        if (style.styleSheet) {\n          style.styleSheet.cssText = css\n        } else {\n          style.appendChild(document.createTextNode(css))\n        }\n        head.appendChild(style)\n      })()\n\n      ;(function (global, window) {\n        ;(function () {\n          " + (buffers.scripts.map(function (buffer) {
            return buffer
          }).join(';')) + "\n        }).call(global)\n      })(window, window);\n\n      ;(function () {\n        // check for leaking\n        var cache = {}\n        var newKeys = Object.keys(window)\n\n        Object.keys(window).forEach(function (key) {\n          cache[key] = window[key]\n          if (!" + keysName + "[key]) window[key] = undefined\n        })\n\n        Object.keys(" + keysName + ").forEach(function (key) {\n          window[key] = " + keysName + "[key]\n        })\n\n        var exports = [" + exports + "];\n        exports.forEach(function (x) {\n          console.error('exporting [' + x + '] from wrapped global.')\n          window[x] = cache[x]\n        })\n      })()\n    })(window || this);\n  "));

  if (!!argv.output) {
    fs.writeFileSync(argv.output, output, 'utf8');
    console.error('webwrap written to: ' + argv.output);
    return undefined
  } else {
    return output
  }
};

module.exports = index;
