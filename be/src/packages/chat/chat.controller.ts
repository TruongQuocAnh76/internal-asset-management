import { Controller, Body, Get, Patch, Query, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @UseGuards(SessionAuthGuard)
  getMessages(
    @Query('chatRoomId') chatRoomId: string,
    @Query('take') take: number,
    @Query('cursor') cursor: string,
  ) {
    return this.chatService.getMessageByChatRoomId(chatRoomId, take, cursor);
  }

  @Patch(':chatRoomId/name')
  @UseGuards(SessionAuthGuard)
  updateChatRoomName(
    @Body() body: {
      name: string;
      chatRoomId: string;
    }
  ) {
    return this.chatService.updateChatRoomName(body.chatRoomId, body.name);
  }

  @Get('rooms')
  @UseGuards(SessionAuthGuard)
  getChatRoomsByUserId(@Query('userId') userId: string) {
    return this.chatService.getChatRoomsByUserId(userId);
  }
}
