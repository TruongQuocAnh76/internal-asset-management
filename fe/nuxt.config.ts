// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['./app/auth', './app/home', './app/assets'],  
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
      '~/app/assets/components'
    ]
  },
  devServer: {
    port: 5173
  }
})
