module.exports = {
  env: {
    es6: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    // I agree with https://github.com/palantir/tslint/issues/3265#issuecomment-333285962
    '@typescript-eslint/interface-name-prefix': 'off',
    // I agree with https://github.com/typescript-eslint/typescript-eslint/issues/201
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      { accessibility: 'no-public' },
    ],
    // Empty interface is often used for standardize interface
    '@typescript-eslint/no-empty-interface': 'off',
    // Strict type is ideal but we are writing code for application but for perfect type system
    // and I think those rules are too strict sometime.
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    // ESLint does not have TSLint's 'ordered-imports' which follows TypeScript's Organise Import
    // specification so use ESLint's 'sort-imports' without DeclarationSort to partially mimic
    // the spec for now.
    // See https://github.com/typescript-eslint/typescript-eslint/pull/256
    'sort-imports': [
      'warn',
      {
        ignoreDeclarationSort: true,
      },
    ],
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        'no-dupe-class-members': 'off',
      },
    },
    {
      files: [
        '*.spec.ts',
        '*.test.ts',
        '*.spec.tsx',
        '*.test.tsx',
        '*.spec.js',
        '*.test.js',
        '*.spec.jsx',
        '*.test.jsx',
        '*/__tests__/*.ts',
        '*/__tests__/*.tsx',
        '*/__tests__/*.js',
        '*/__tests__/*.jsx',
      ],
      env: {
        browser: true,
        jest: true,
      },
    },
  ],
};
