// ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects

var mem = {}
module.exports = mem

var valueProperties = [
  'Infinity',
  'NaN',
]

var functionProperties = [
  'eval',
  'uneval',
  'isFinite',
  'isNaN',
  'parseFloat',
  'parseInt',
  'decodeURI',
  'decodeURIComponent',
  'encodeURI',
  'encodeURIComponent',
  'escape',
  'unescape',
]

var fundamentalObjects = [
  'Object',
  'Function',
  'Boolean',
  'Symbol',
  'Error',
  'EvalError',
  'InternalError',
  'RangeError',
  'ReferenceError',
  'SyntaxError',
  'TypeError',
  'URIError',
]

var numbersAndDates = [
  'Number',
  'Math',
  'Date',
]

var textProcessing = [
  'String',
  'RegExp',
]

var indexedCollections = [
  'Array',
  'Int8Array',
  'Uint8Array',
  'Uint8ClampedArray',
  'Int16Array',
  'Uint16Array',
  'Int32Array',
  'Uint32Array',
  'Float32Array',
  'Float64Array',
]

var keyedCollections = [
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
]

var vectorCollections = [
  'SIMD',
  'SIMD.Float32x4',
  'SIMD.Float64x2',
  'SIMD.Int8x16',
  'SIMD.Int16x8',
  'SIMD.Int32x4',
  'SIMD.Uint8x16',
  'SIMD.Uint16x8',
  'SIMD.Uint32x4',
  'SIMD.Bool8x16',
  'SIMD.Bool16x8',
  'SIMD.Bool32x4',
  'SIMD.Bool64x2',
]

var structuredData = [
  'ArrayBuffer',
  'SharedArrayBuffer',
  'Atomics',
  'DataView',
  'JSON',
]

var controlAbstractionObjects = [
  'Promise',
  'Generator',
  'GeneratorFunction',
  'AsyncFunction',
]

var reflection = [
  'Reflect',
  'Proxy',
]

var internationalization = [
  'Intl',
  'Intl.Collator',
  'Intl.DateTimeFormat',
  'Intl.NumberFormat',
]

var webAssembly = [
  'WebAssembly',
  'WebAssembly.Module',
  'WebAssembly.Instance',
  'WebAssembly.Memory',
  'WebAssembly.Table',
  'WebAssembly.CompileError',
  'WebAssembly.LinkError',
  'WebAssembly.RuntimeError',
]

var other = [
  'arguments',
  'this',
  'window',
  'document',
  'exports',
  'define',
  'module',
  'require',
  'console',
  'navigator',
  'setTimeout',
  'setInterval',
  'clearTimeout',
  'clearInterval',
  'performance',
  'requestAnimationFrame',
  'requestIdleCallback',
  'cancelIdleCallback',
]

// ref: https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model
var domInterfaces = [
  'Attr',
  'CharacterData',
  'ChildNode ',
  'Comment',
  'CustomEvent',
  'Document',
  'DocumentFragment',
  'DocumentType',
  'DOMError',
  'DOMException',
  'DOMImplementation',
  'DOMString',
  'DOMTimeStamp',
  'DOMSettableTokenList',
  'DOMStringList',
  'DOMTokenList',
  'Element',
  'Event',
  'EventTarget',
  'HTMLCollection',
  'MutationObserver',
  'MutationRecord',
  'NamedNodeMap',
  'Node',
  'NodeFilter',
  'NodeIterator',
  'NodeList',
  'NonDocumentTypeChildNode',
  'ParentNode',
  'ProcessingInstruction',
  'Selection',
  'Range',
  'Text',
  'TextDecoder',
  'TextEncoder',
  'TimeRanges',
  'TreeWalker',
  'URL',
  'Window',
  'Worker',
  'XMLDocument',
]

valueProperties.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Value properties'
} )

functionProperties.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Function properties'
} )

fundamentalObjects.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Fundamental objects'
} )

numbersAndDates.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Numbers and dates'
} )

textProcessing.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Text processing'
} )

indexedCollections.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Indexed collections'
} )

keyedCollections.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Keyed collections'
} )

vectorCollections.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Vector collections'
} )

structuredData.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Structured data'
} )

controlAbstractionObjects.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Control abstraction objects'
} )

reflection.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Reflection'
} )

internationalization.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Internationalization'
} )

webAssembly.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'WebAssembly'
} )

other.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'Other'
} )

domInterfaces.forEach( function ( item ) {
  item = item.trim()
  mem[ item ] = 'DOM interfaces'
} )
