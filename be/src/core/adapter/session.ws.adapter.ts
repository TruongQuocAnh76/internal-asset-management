import { INestApplicationContext } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";

export class SessionWsAdapter extends IoAdapter {
    constructor(
        app: INestApplicationContext,
        private sessionMiddleware: any,
    ) {
        super(app);
    }
    createIOServer(port: number, options?: any) {
        const server = super.createIOServer(port, options);
        server.use((socket, next) => {
            this.sessionMiddleware(socket.request, {} as any, next);
        })
        return server;
    }
}