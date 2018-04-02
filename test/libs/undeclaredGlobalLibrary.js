UndeclaredGlobalOnlyShownToScript = (function( exports ){
  Cowbell = function ( num ) {
    return num * 2
  }

  UndeclaredGlobalObject = {
    name: 'muumi'
  }

  function UndeclaredScopedNamedFunction ( num ) {
    return num * 2
  }

  exports.foo = 'foo'

  return exports.foo
})({});

function UndeclaredGlobalNamedFunction ( num ) {
  return num * 2
}
