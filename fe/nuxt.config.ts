export default defineNuxtConfig({
  extends: ['./app/auth', './app/home', './app/assets', './app/requests', './app/kits', './app/purchase-requests', './app/users', './app/audit-logs', './app/chat'],  
  pages: true,
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
      '~/app/kits/components',
      '~/app/purchase-requests/components',
      '~/app/users/components',
      '~/app/audit-logs/components',
      '~/app/chat/components'
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
