const path = require('path');

module.exports = {
    parserOptions: { tsconfigRootDir: __dirname, project: './tsconfig.json' },
    extends: [
        path.resolve(__dirname, './../../.eslintrc.js'),
        'eslint:recommended',
        'airbnb-base',
        'airbnb-typescript/base',
        'prettier',
        'plugin:json/recommended',
    ],
    rules: {
        'max-classes-per-file': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-case-declarations': 'off',
        'import/prefer-default-export': 'off',
        'class-methods-use-this': 'off',
        'no-console': 'off',
    },
};
