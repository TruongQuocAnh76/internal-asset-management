import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Server, Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { LoggingWsInterceptor } from '../../core/interceptors/logging.ws.interceptor';
import { CreateChatRoomDto } from './dto/create-chatroom.dto';
import {
  ChatRoomNotFoundError,
  DirectChatExistsError,
  MessageNotFoundError,
  ParticipantNotFoundError,
} from './errors';
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
  },
})

@UseInterceptors(LoggingWsInterceptor)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}
  @WebSocketServer(
  )
  server: Server;

  private rethrowAsWs(error: unknown): never {
    if (error instanceof DirectChatExistsError) {
      throw new WsException({ status: 'conflict', message: error.message });
    }
    if (
      error instanceof ChatRoomNotFoundError ||
      error instanceof MessageNotFoundError ||
      error instanceof ParticipantNotFoundError
    ) {
      throw new WsException({ status: 'not_found', message: error.message });
    }
    throw error;
  }


  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    // join user room
    const request = client.request as any;
    client.join(request.session.userId);

    // join all of user's chat rooms
    // NOTE: requires backend to expose GET /chat/rooms?userId=... (see chat.service getChatRoomsByUserId)
    this.chatService.getChatRoomsByUserId(userId).then((rooms) => {
      rooms.forEach((room) => client.join(room.id));
    });
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    client.leave(userId);
    // NOTE: socket.io automatically removes the socket from all rooms on disconnect, so no need to manually leave chat rooms
  }

  @SubscribeMessage('message:send')
  async handleMessage(client: Socket, payload: CreateMessageDto) {
    try {
      const message = await this.chatService.createMessage(payload);
      this.server.emit('message:received', message);
    } catch (error) {
      this.rethrowAsWs(error);
    }
  }

  @SubscribeMessage('message:update')
  async handleUpdateMessage(client: Socket, payload: { messageId: string, content: string }) {
    try {
      const message = await this.chatService.updateMessage(payload.messageId, payload.content);
      this.server.emit('message:updated', message);
    } catch (error) {
      this.rethrowAsWs(error);
    }
  }

  @SubscribeMessage('message:delete')
  async handleDeleteMessage(client: Socket, payload: { messageId: string }) {
    try {
      await this.chatService.deleteMessage(payload.messageId);
      this.server.emit('message:deleted', { messageId: payload.messageId });
    } catch (error) {
      this.rethrowAsWs(error);
    }
  }

  @SubscribeMessage('chatroom:create')
  async handleCreateChatRoom(client: Socket, payload: CreateChatRoomDto) {
    try {
      const chatRoom = await this.chatService.createChatRoom(payload);
      this.server.emit('chatroom:created', chatRoom);
    } catch (error) {
      this.rethrowAsWs(error);
    }
  }
  @SubscribeMessage('chatroom:join')
  async handleJoinChatRoom(client: Socket, payload: { chatRoomId: string, userId: string[] }) {
    try {
      await this.chatService.addParticipantsToChatRoom(payload.chatRoomId, payload.userId);
      this.server.emit('chatroom:joined', { chatRoomId: payload.chatRoomId, userId: payload.userId });
    } catch (error) {
      this.rethrowAsWs(error);
    }
  }
  @SubscribeMessage('chatroom:leave')
  async handleLeaveChatRoom(client: Socket, payload: { chatRoomId: string, userId: string[] }) {
    try {
      await this.chatService.removeParticipantsFromChatRoom(payload.chatRoomId, payload.userId);
      this.server.emit('chatroom:left', { chatRoomId: payload.chatRoomId, userId: payload.userId });
    } catch (error) {
      this.rethrowAsWs(error);
    }
  }
}