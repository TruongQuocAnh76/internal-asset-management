import { useRuntimeConfig, useRouter } from '#imports'

export const useAuth = () => {
  const user = useState<any | null>('auth_user', () => null)
  const checked = useState<boolean>('auth_checked', () => false)
  const loading = useState<boolean>('auth_loading', () => false)
  const config = useRuntimeConfig()
  const router = useRouter()

  const baseOptions = {
    baseURL: config.public.backendUrl,
    credentials: 'include' as const,
    headers: { 'Content-Type': 'application/json' }
  }

  const getUser = async () => {
    try {
      const data = await $fetch('/users/@me', {
        method: 'GET',
        ...baseOptions
      })
      user.value = data ?? null
    } catch (err) {
      user.value = null
    } finally {
      checked.value = true
    }
    return { user: user.value, checked: checked.value }
  }

  const login = async (credential: string, password: string) => {
    loading.value = true
    try {
      await $fetch('/auth/signin', {
        method: 'POST',
        body: { credential, password },
        ...baseOptions
      })

      await getUser()

      if (user.value) {
        await router.push('/home') 
      } else {
        throw new Error('Signin succeeded but user not returned; session cookie may not be set')
      }

      return user.value
    } finally {
      loading.value = false
    }
  }

  const signup = async (username: string, email: string, first_name: string, last_name: string, password: string, department: string) => {
    loading.value = true
    try {
      await $fetch('/auth/signup', {
        method: 'POST',
        body: { username, email, first_name, last_name, password, department },
        ...baseOptions
      })
      await getUser()
      return user.value
    } finally {
      loading.value = false
    }
  }

  const signout = async () => {
    loading.value = true
    try {
      await $fetch('/auth/signout', {
        method: 'POST',
        ...baseOptions
      })
      user.value = null
      checked.value = false
      return true
    } catch (err) {
      user.value = null
      checked.value = false
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    checked,
    loading,
    login,
    signup,
    getUser,
    signout
  }
}