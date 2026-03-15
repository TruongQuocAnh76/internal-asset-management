export default defineNuxtConfig({
  name: 'chat',
  imports: {
    dirs: ['composables'],
  },
  components: [
    { path: './components', pathPrefix: false },
  ],
})
