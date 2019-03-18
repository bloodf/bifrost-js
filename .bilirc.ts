import {name} from './package.json';
import {Config as Configuration} from 'bili';

const toUpperCase = (
  _: string,
  char: string,
): string => char.toUpperCase();

const moduleName = name.replace(/-(\w)/g, toUpperCase);

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
    moduleName,
    minify: true,
    sourceMap: true,
    target: 'browser',
  },
  plugins: {}
};

export default configuration;
