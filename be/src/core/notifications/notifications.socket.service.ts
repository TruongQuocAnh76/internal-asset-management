import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsSocketService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server?.to(userId).emit(event, payload);
  }
}
