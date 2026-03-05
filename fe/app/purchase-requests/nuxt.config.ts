export default defineNuxtConfig({
  name: 'purchase-requests',

  imports: {
    dirs: ['composables'],
  },

  components: {
    dirs: [
      {
        path: 'components',
        pathPrefix: false,
        prefix: 'PurchaseRequest',
      },
    ],
  },
})
