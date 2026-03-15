export default defineNuxtConfig({
  name: 'notifications',
  imports: {
    dirs: ['composables'],
  },
  components: [
    { path: './components', pathPrefix: false },
  ],
})
