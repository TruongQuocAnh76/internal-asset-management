// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  extends: ['./app/auth', './app/home'],  
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  css: ['~~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      backendUrl: ''
    }
  },
  components: {
    dirs: [
      '~/components',
      '~/app/auth/components',
      '~/app/home/components'
    ]
  },
  devServer: {
    port: 5173
  }
})
