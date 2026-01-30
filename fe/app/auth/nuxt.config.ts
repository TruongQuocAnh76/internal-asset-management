export default defineNuxtConfig({
  // Landing domain mini app configuration
  modules: [
    '@nuxtjs/tailwindcss'
  ],
  components: [
    { path: './components', pathPrefix: false },
  ],
}) 