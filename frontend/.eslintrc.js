module.exports = {
  root: true,
  env: {
    browser: true,
    es2020: true,
    node: true,
  },
  globals: {
    __dirname: 'readonly',
    module: 'readonly',
    require: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: 'espree',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-refresh', 'react'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    'no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-console': 'warn',
    'no-debugger': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'no-undef': 'warn',
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.js', '*.jsx'],
      env: {
        browser: true,
        es2020: true,
        node: true,
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        process: 'readonly',
      },
    },
  ],
}
