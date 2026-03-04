export default defineNuxtRouteMiddleware(async (to, from) => {
  const excludePaths = ['/signin', '/signup']
  if (excludePaths.includes(to.path)) return

  const { user, checked, getUser } = useAuth()

  if (!checked.value) {
    await getUser()
  }

  if (!user.value) {
    return navigateTo('/signin')
  }
})