/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig, globalIgnores } from 'eslint/config';
import babel from '@babel/eslint-plugin';
import globals from 'globals';
import devextremeJavascriptConfig from 'eslint-config-devextreme/javascript';

export default defineConfig([globalIgnores([
  'dist/**/*',
  'docs/**/*',
  'node_modules/**/*',
  'test/functional/example/**/*',
]),
...devextremeJavascriptConfig,
{
  plugins: {
    '@babel': babel,
  },

  languageOptions: {
    globals: {
      ...globals.browser,
      ...globals.commonjs,
    },

    ecmaVersion: 2020,
    sourceType: 'module',
  },

  settings: {
    'import/resolver': {
      webpack: {
        config: '_develop/webpack.config.js',
      },
    },
  },

  rules: {
    'prefer-arrow-callback': 'warn',
    'arrow-body-style': 'off',
    'class-methods-use-this': 'off',

    'import/no-extraneous-dependencies': ['error', {
      devDependencies: ['_develop/*.js', 'test/**/*.js'],
    }],

    'no-param-reassign': 'off',

    'no-use-before-define': ['error', {
      functions: false,
    }],

    'import/named': 'error',
    'max-classes-per-file': 'off',
  },
}]);
