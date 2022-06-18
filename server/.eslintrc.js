module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    'standard'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    camelcase: 'off',
    'no-dupe-class-members': 'off',
    'no-useless-return': 'off',
    'no-use-before-define': 'off',
    'no-new': 'off',
    '@typescript-eslint/no-use-before-define': [
      'error', // by default, eslint reports incorrect errors
      { functions: false, classes: false }
    ],
    'no-unused-vars': [
      'error',
      { destructuredArrayIgnorePattern: '^_' }
    ]
  },
  globals: {
    GalaxyInfo: 'readonly',
    Optional: 'readonly',
    AllProps: 'readonly',
    GalaxyInfoCommand: 'readonly'
  }

}
