import { ref } from 'vue'
import { useRuntimeConfig } from '#app'

export const useAuth = () => {
    const user = ref(null)
    const config = useRuntimeConfig()

    const login = async (credential: string, password: string) => {
        const data = await $fetch('/auth/signin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            baseURL: config.public.backendUrl,
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
            body: { username, email, first_name, last_name, password, department }
        })

        user.value = data
        return data
    }

    return {
        user,
        login,
        signup
    }
}