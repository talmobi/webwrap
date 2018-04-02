UndeclaredGlobalOnlyShownToScript = (function( exports ){
  Cowbell = function ( num ) {
    return num * 2
  }

  UndeclaredGlobalObject = {
    name: 'muumi'
  }

  function UndeclaredGlobalFunction ( num ) {
    return num * 2
  }

  exports.foo = 'foo'

  return exports.foo
})({});
