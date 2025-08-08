export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
    transform: {
        '^.+\\.ts$': ['ts-jest', {
            tsconfig: 'tsconfig.json'
        }]
    },
    moduleFileExtensions: ['ts', 'js'],
    setupFilesAfterEnv: ['<rootDir>/src/testing/setup.ts'],
    testTimeout: 10000 // Some DB operations might take time
};
