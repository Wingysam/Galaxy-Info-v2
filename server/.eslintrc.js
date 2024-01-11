module.exports = {
    "env": {
        "es2021": true,
        "node": true
    },
    "extends": "standard-with-typescript",
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
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
        ],
        'no-multiple-empty-lines': 'error',
        '@typescript-eslint/strict-boolean-expressions': [
            'error',
            {
                allowNullableBoolean: true,
                allowAny: true
            }
        ],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-misused-promises': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off'
      },
      globals: {
        GalaxyInfo: 'readonly',
        Optional: 'readonly',
        AllProps: 'readonly',
        GalaxyInfoCommand: 'readonly'
      }
}
