import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseInterceptors } from '@nestjs/common';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { CreateMessageDto } from './dto/create-message.dto';
import { LoggingWsInterceptor } from '../../core/interceptors/logging.ws.interceptor';
import { CreateChatRoomDto } from './dto/create-chatroom.dto';
@WebSocketGateway()
@UseInterceptors(LoggingWsInterceptor)
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}
  @WebSocketServer()
  server;

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
  }

  @SubscribeMessage('message:send')
  handleMessage(client: Socket, payload: CreateMessageDto) {
    this.chatService.createMessage(payload).then((message) => {
      this.server.emit('message:received', message);
    });
  }

  @SubscribeMessage('messsage:update')
  handleUpdateMessage(client: Socket, payload: { messageId: string, content: string }) {
    this.chatService.updateMessage(payload.messageId, payload.content).then((message) => {
      this.server.emit('message:updated', message);
    })
  }

  @SubscribeMessage('message:delete')
  handleDeleteMessage(client: Socket, payload: { messageId: string }) {
    this.chatService.deleteMessage(payload.messageId).then((messageId) => {
      this.server.emit('message:deleted', { messageId });
    })
  }

  @SubscribeMessage('chatroom:create')
    handleCreateChatRoom(client: Socket, payload: CreateChatRoomDto) {
        this.chatService.createChatRoom(payload).then((chatRoom) => {
            this.server.emit('chatroom:created', chatRoom);
        });
    }
  @SubscribeMessage('chatroom:join')
    handleJoinChatRoom(client: Socket, payload: { chatRoomId: string, userId: string[] }) {
        this.chatService.addParticipantsToChatRoom(payload.chatRoomId, payload.userId).then(() => {
            this.server.emit('chatroom:joined', { chatRoomId: payload.chatRoomId, userId: payload.userId });
        });
    }
  @SubscribeMessage('chatroom:leave')
    handleLeaveChatRoom(client: Socket, payload: { chatRoomId: string, userId: string[] }) {
        this.chatService.removeParticipantsFromChatRoom(payload.chatRoomId, payload.userId).then(() => {
            this.server.emit('chatroom:left', { chatRoomId: payload.chatRoomId, userId: payload.userId });
        });
    }
}