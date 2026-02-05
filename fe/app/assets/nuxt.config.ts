export default defineNuxtConfig({
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  components: [
    { path: './components', pathPrefix: false },
  ],
  css: ['~/assets/css/main.css'],
}) 