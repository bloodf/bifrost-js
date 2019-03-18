import {Config as Configuration} from 'bili';

const configuration: Configuration = {
  banner: true,
  bundleNodeModules: false,
  input: 'src/index.js',
  babel: {
    asyncToPromises: true,
    babelrc: false,
  },
  globals: {
    PagarMeBifrost: 'PagarMeBifrost'
  },
  output: {
    format: [
      'es',
      'cjs',
      'umd',
      'amd',
      'esm',
    ],
    moduleName: 'PagarMeBifrost',
    minify: true,
    sourceMap: true,
    target: 'browser',
  },
  plugins: {}
};

export default configuration;
