import { io, type Socket } from "socket.io-client"

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const socket: Socket = io(config.public.backendUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"]
  })

  return {
    provide: {
      chatSocket: socket
    }
  }
})