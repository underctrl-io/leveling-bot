import { defineConfig } from 'commandkit/config';
import { cache } from '@commandkit/cache';
import { i18n } from '@commandkit/i18n';
import { devtools } from '@commandkit/devtools';

export default defineConfig({
  plugins: [cache(), i18n(), devtools()],
});
