module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'import'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript'
    ],
    env: { node: true, es2022: true, jest: true },
    parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    settings: { 'import/resolver': { typescript: { project: ['./apps/pwrprogram/tsconfig.json', './packages/shared/tsconfig.json'] } } },
    rules: {
        'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true } }],
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    },
    ignorePatterns: ['dist', 'node_modules', '**/*.js']
};
