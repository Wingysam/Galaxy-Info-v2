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
    'no-dupe-class-members': 'off'
  },
  globals: {
    GalaxyInfo: 'readonly',
    Optional: 'readonly',
    AllProps: 'readonly',
    GalaxyInfoCommand: 'readonly'
  }

}
