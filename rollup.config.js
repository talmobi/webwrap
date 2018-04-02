import buble from 'rollup-plugin-buble'

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'cjs'
  },
  plugins: [
    buble()
  ]
}
