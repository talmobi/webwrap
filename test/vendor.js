;(function (global) {
  console.log('vendor: typeof window.jQuery: ' + typeof window.jQuery)
  console.log('vendor: typeof jQuery: ' + typeof jQuery)
  console.log('vendor: window === global: ' + (window === global))
  global.say = function (name) {
    return 'hello, ' + name
  }
  global.lib = { // export this by specifying --export cli argument
    say: global.say
  }

  bestdog && console.log('vendor: typeof bestdog: ' + bestdog)
  bestdog = 'Mollie'

})(this)
