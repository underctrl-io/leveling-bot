import { defineConfig } from 'commandkit';
import { cache } from '@commandkit/cache';

export default defineConfig({
  plugins: [cache()],
});
