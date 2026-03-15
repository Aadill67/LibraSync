/** @type {import('jest').Config} */
export default {
  // Use native ESM (no Babel transform needed)
  transform: {},
  // Test file pattern
  testMatch: ["**/tests/**/*.test.js"],
  // Increase timeout for DB operations
  testTimeout: 30000,
  // Force exit after tests complete (cleanup)
  forceExit: true,
  // Detect open handles for debugging
  detectOpenHandles: true,
  // Run tests sequentially to avoid DB conflicts
  maxWorkers: 1,
  // Suppress console logs during tests
  silent: false,
};
