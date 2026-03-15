import { Controller, Body, Get, Patch, Query, UseGuards, NotFoundException, ConflictException } from '@nestjs/common';
import { SessionAuthGuard } from 'src/core/auth/guards/session-auth.guard';
import { ChatService } from './chat.service';
import { ChatRoomNotFoundError, DirectChatExistsError, ParticipantNotFoundError } from './errors';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  @UseGuards(SessionAuthGuard)
  async getMessages(
    @Query('chatRoomId') chatRoomId: string,
    @Query('take') take: number,
    @Query('cursor') cursor: string,
  ) {
    try {
      return await this.chatService.getMessageByChatRoomId(chatRoomId, take, cursor);
    } catch (error) {
      if (error instanceof ChatRoomNotFoundError) throw new NotFoundException(error.message);
      throw error;
    }
  }

  @Patch(':chatRoomId/name')
  @UseGuards(SessionAuthGuard)
  async updateChatRoomName(
    @Body() body: {
      name: string;
      chatRoomId: string;
    }
  ) {
    try {
      return await this.chatService.updateChatRoomName(body.chatRoomId, body.name);
    } catch (error) {
      if (error instanceof ChatRoomNotFoundError) throw new NotFoundException(error.message);
      throw error;
    }
  }

  @Get('rooms')
  @UseGuards(SessionAuthGuard)
  async getChatRoomsByUserId(@Query('userId') userId: string) {
    try {
      return await this.chatService.getChatRoomsByUserId(userId);
    } catch (error) {
      if (error instanceof ChatRoomNotFoundError) throw new NotFoundException(error.message);
      throw error;
    }
  }
}
