import buble from 'rollup-plugin-buble'

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle.js',
  format: 'umd',
  moduleName: 'webwrap',
  plugins: [
    buble()
  ]
}
