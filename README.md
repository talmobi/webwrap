# webwrap - Super simple web wrapper/packager

[![npm](https://img.shields.io/npm/v/webwrap.svg?maxAge=3600)](https://www.npmjs.com/package/wrollup)
[![npm](https://img.shields.io/npm/dm/webwrap.svg?maxAge=3600)](https://www.npmjs.com/package/wrollup)
[![npm](https://img.shields.io/npm/l/webwrap.svg?maxAge=3600)](https://www.npmjs.com/package/wrollup)

## Simple to use
```bash
npm install -g webwrap
webwrap css/bundle.css js/vendors.js js/bundle.js > output.js
```

# About
A simple tool to wrap your css and js files into a single script file that unloads itself without polluting the global scope. Use `--export <string>` cli argument to export to the global object if desired.

# Why
Sometimes it's easier to share/transport a single script. Sometimes a simple concat isn't enough. Sometimes your build step doesn't support this kind of thing.

# Why not use webpack with style-loaders and css-modules and react-css-modules and all that jazz?
This is a very simple step that doesn't care if you're using webpack, react etc and is not meant as a replacement for those things; just a simple secondary option for simple setups in some cases.

# How
The files are loaded (in order); CSS files (*.css) are read using fs.readFileSync and concatenated into a single string that is then appended as a style element to document.head on load.
JS (all other files) are concatenated, in order, after each other and wrapped inside an iife.

# Arguments
```bash
$ webwrap --help

  Usage: webwrap [options] <files(js|css)>... > output.js
  
  Sample: webwrap css/bundle.min.css js/vendors.min.js js/bundle.min.js > output.js
  
  Options:
  
  -o, --output                   Output file (stdout by default).
                                                                    
  -x, --export                   Global variable to keep/export through
                                 to the true global object.
                                 
  -v, --version                  Display version
  -h, --help                     Display help information (this text)
```

# Installation
```bash
npm install --save-dev webwrap # locally (for use with npm scripts)
```
or
```bash
npm install -g webwrap # globally (not recommended)
```

# Test
```bash
npm test
```

# License
MIT
