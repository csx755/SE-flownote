export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  devServer: { port: 3001 },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/color-mode'],
  colorMode: {
    classSuffix: '',
  },
  tailwindcss: {
    cssPath: '~/assets/css/main.css',
  },
  alias: {
    '~': './',
    '@': './',
  },
})
