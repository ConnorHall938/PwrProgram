// ESLint Flat Config
const js = require('@eslint/js');

module.exports = [
    js.configs.recommended,
    {
        files: ['**/*.ts'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            parser: require('@typescript-eslint/parser'),
            parserOptions: { project: false },
            globals: {
                console: 'readonly',
                require: 'readonly',
                module: 'readonly',
                process: 'readonly',
                // Jest globals
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                beforeEach: 'readonly',
                afterAll: 'readonly',
                afterEach: 'readonly'
            }
        },
        plugins: {
            '@typescript-eslint': require('@typescript-eslint/eslint-plugin'),
            import: require('eslint-plugin-import')
        },
        rules: {
            'import/order': ['warn', { 'newlines-between': 'always', alphabetize: { order: 'asc', caseInsensitive: true } }],
            // Disable base rule so TS version is authoritative; TS rule below enforces unused vars.
            'no-unused-vars': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',      // allow intentionally unused function params
                    varsIgnorePattern: '^_',      // allow intentionally unused local variables
                    caughtErrors: 'all',
                    caughtErrorsIgnorePattern: '^_', // allow try/catch unused error variable if prefixed
                    destructuredArrayIgnorePattern: '^_' // allow ignored array elements
                }
            ]
        }
    },
    { ignores: ['dist', 'node_modules', '**/*.js'] }
];
