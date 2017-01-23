#!/usr/bin/env node

var output = require('./dist/bundle.js')(process.argv)
if (output !== undefined) console.log(output)
