// astro.config.mjs
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';
import { dark } from '@clerk/ui/themes';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare',
    platformProxy: { enabled: true },
  }),
  integrations: [
    clerk({
      afterSignOutUrl: '/',
      appearance: {
        theme: dark,
        variables: {
          colorPrimary: '#9ed1bd',
          colorBackground: '#1a1c1b',
          colorInputBackground: '#0d0f0e',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '0.375rem',
        },
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});