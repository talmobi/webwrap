console.log('hello world')
console.log('typeof document: ' + typeof document)
var app = document.createElement('div')
console.log('typeof window: ' + typeof window)
console.log('window === global: ' + (window === global))
undeclaredGlobalVariable = 'Mollie'
console.log(
  'window.undeclaredGlobalVariable === "Mollie": ' +
  ( window.undeclaredGlobalVariable === 'Mollie' )
)
console.log('typeof say: ' + typeof say)
console.log('typeof window.say: ' + typeof window.say)
console.log('typeof lib: ' + typeof lib)
console.log('typeof window.lib: ' + typeof window.lib)
console.log('typeof window.React: ' + typeof window.React)
console.log('typeof window.redom: ' + typeof window.redom)
console.log('typeof bestdog: ' + bestdog)

console.log( 'Cowbell: ' + Cowbell( 8 ) )
console.log( 'UndeclaredGlobalObject: ' + UndeclaredGlobalObject.name )

function scopedGlobalFunction () {
  scopedGlobalVariable = 42
  console.log( 'scopedGlobalVariable: ' + scopedGlobalVariable )
}

scopedGlobalFunction()

app.innerHTML = window.say('giraffe')
app.id = 'app'
console.log(window.say('to my little friend'))
document.body.appendChild(app)

console.log( 'UndeclaredGlobalOnlyShownToScript: ' + UndeclaredGlobalOnlyShownToScript )
console.log( 'typeof luxon: ' + ( typeof luxon ) )

console.log( 'typeof seafood: ' + ( typeof window.seafood ) )
console.log( 'typeof seabar: ' + ( typeof window.seabar ) )
