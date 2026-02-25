import { useRuntimeConfig } from '#app'

export const useAuth = () => {
    const user = useState<any | null>('auth_user', () => null)
    const checked = useState<boolean>('auth_checked', () => false)
    const config = useRuntimeConfig()

    const login = async (credential: string, password: string) => {
        const data = await $fetch('/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            baseURL: config.public.backendUrl,
            credentials: 'include',
            body: { credential, password }
        })

        user.value = data
        return data
    }

    const signup = async (username: string, email: string, first_name: string, last_name: string, password: string, department: string) => {
        const data = await $fetch('/auth/signup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            baseURL: config.public.backendUrl,
            credentials: 'include',
            body: { username, email, first_name, last_name, password, department }
        })

        user.value = data
        return data
    }

    const getUser = async () => {
        try {
        const data = await $fetch('/users/@me', {
            method: 'GET',
            baseURL: config.public.backendUrl,
            credentials: 'include'
        })
        user.value = data;
    }    catch (error) {
        user.value = null
    } finally {
        checked.value = true
    }
        return { user: user.value, checked: checked.value }
    }

    const signout = async () => {
        try {
        await $fetch('/auth/signout', {
            method: 'POST',
            baseURL: config.public.backendUrl,
            credentials: 'include'
        })
    } catch (error) {
        // temporarily invalidate user cache
        user.value = null
    } finally {
        checked.value = false
    }
    }

    return {
        user,
        checked,
        login,
        signup,
        getUser,
        signout
    }
}