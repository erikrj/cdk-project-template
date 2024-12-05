// See https://vitest.dev/config/
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.integration.test.mts'],
  },
});
