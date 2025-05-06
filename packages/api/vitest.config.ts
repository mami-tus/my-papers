import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // これでdescribe, it, expectなどを自動的に使用可能に
  },
});
