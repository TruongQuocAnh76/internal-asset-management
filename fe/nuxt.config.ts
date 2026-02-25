export default defineNuxtConfig({
  extends: ['./app/auth', './app/home', './app/assets', './app/requests', './app/kits'],  
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    public: {
      backendUrl: ''
    }
  },
  components: {
    dirs: [
      '~/components',
      '~/app/auth/components',
      '~/app/home/components',
      '~/app/assets/components',
      '~/app/requests/components',
      '~/app/kits/components'
    ]
  },
  devServer: {
    port: 5173
  },
  nitro: {
    devProxy: {
      '/api': {
        target: 'http://backend:3000',
        changeOrigin: true
      }
    }
  },
  ssr: false,
})
