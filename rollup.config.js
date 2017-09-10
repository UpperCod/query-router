
import buble    from 'rollup-plugin-buble'

export default {
  entry : 'index.js',
  dest  : 'build/index.js',
  format: 'umd',
  moduleName  : 'queryRouter',
  plugins: [
    buble(),
  ]
}
