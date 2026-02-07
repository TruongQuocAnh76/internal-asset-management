export default defineNuxtConfig({
  // Module identification
  name: 'requests',

  // Auto-import composables from this module
  imports: {
    dirs: ['composables']
  },

  // Component auto-registration
  components: {
    dirs: [
      {
        path: 'components',
        pathPrefix: false,
        prefix: 'Request'
      }
    ]
  }
})
