/** @format */

module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  plugins: ['prettier', 'jsdoc'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'prettier/prettier': ['error'],
    'jsdoc/no-undefined-types': ['warn'],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single'],
    semi: ['error', 'always'],
    'no-unused-vars': ['error'],
    camelcase: 'off',
    'prefer-const': [2, { destructuring: 'any' }],
    'no-duplicate-imports': ['error', { includeExports: true }],
  },
};
