# webwrap - Super simple web wrapper/packager

[![npm](https://img.shields.io/npm/v/webwrap.svg?maxAge=86400)](https://www.npmjs.com/package/wrollup)
[![npm](https://img.shields.io/npm/dm/webwrap.svg?maxAge=86400)](https://www.npmjs.com/package/wrollup)
[![npm](https://img.shields.io/npm/l/webwrap.svg?maxAge=86400)](https://www.npmjs.com/package/wrollup)

## Simple to use
```bash
npm install -g webwrap
webwrap css/bundle.css js/vendors.js js/bundle.js > output.js
```

# About
A simple tool to wrap your css and js files into a single, scoped script file that unloads itself.

# Why
Wrap your static css, and static oldskool vendor scripts (that attach to the global window object like window.jQuery, window.React etc), and your static project javascript into a single script.js that unloads itself.

# Why not use webpack or rollup to bundle and scope your script files and css files?
Sometimes you can do that, some times you can only use a static library script (the oldskool way), sometimes you have both.
Whatever the case, this bundles them all into a single script file without needing any config files.
Works well as an npm script for production.

# How
The files are loaded (in order); CSS files (*.css) are read using fs.readFileSync and concatenated into a single string that is then appended as a style element to document.head on load.
JS (all other files) are concatenaded, in order, after each other wrapped inside an iife.

# Arguments
```bash
$ webwrap --help

  Usage: webwrap [options] <files(js|css)>... > output.js
  
  Sample: webwrap css/bundle.min.css js/vendors.min.js js/bundle.min.js > output.js
  
  Options:
  
  -o, --output                   Output file (stdout by default).
                                                                    
  -x, --export                   Global variable to keep/export to
                                 the true global object.
                                 
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
