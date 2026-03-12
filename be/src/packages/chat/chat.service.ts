import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Prisma } from '@prisma/client';
import { CreateChatRoomDto } from './dto/create-chatroom.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ChatRoomType } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async createChatRoom(body: CreateChatRoomDto, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const chatRoom = await client.chatRooms.create({
      data: {
        name: body.name,
        type: body.type,
        chatRoomParticipants: {
          createMany: {
            data: body.participantIds.map((id) => ({
            user_id: id,
          })),
        },
        },
      },
    });
    return chatRoom;
  }

  async createMessage(body: CreateMessageDto, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    try {
      const message = await client.messages.create({
        data: {
          sender_id: body.senderId,
          chat_room_id: body.chatRoomId,
          content: body.content,
          type: body.type,
        },
      });
      return message;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code == 'P2003'
      ) {
        if (body.chatRoomType === ChatRoomType.GROUP)
          throw new NotFoundException('Chat room not found');

        // new personal inbox case
        const chatRoom = await this.createChatRoom({
          name: `Personal Chat between ${body.senderId} and ${body.chatRoomId}`,
          type: ChatRoomType.DIRECT,
          participantIds: [body.senderId, body.chatRoomId],
          tx: tx ?? this.prisma,
        } as CreateChatRoomDto);

        const message = await client.messages.create({
          data: {
            sender_id: body.senderId,
            chat_room_id: chatRoom.id,
            content: body.content,
            type: body.type,
          },
        });
        return message;
      }
    }
  }

  async deleteMessage(messageId: string) {
    try {
      return await this.prisma.messages.delete({
        where: {
          id: messageId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException('Message not found');
      }
      throw error;
    }
  }

  async updateMessage(messageId: string, content: string) {
    try {
      return await this.prisma.messages.update({
        where: {
          id: messageId,
        },
        data: {
          content,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException('Message not found');
      }
      throw error;
    }
  }

  async getMessageByChatRoomId(
    chatRoomId: string,
    take: number,
    cursor: string,
  ) {
    return this.prisma.messages.findMany({
      where: {
        chat_room_id: chatRoomId,
      },
      take,
      skip: 1,
      cursor: cursor ? { id: cursor } : undefined,
    });
  }

  async getChatRoomsByUserId(userId: string) {
    try {
      const chatRooms = await this.prisma.chatRooms.findMany({
        where: {
          chatRoomParticipants: {
            some: {
              user_id: userId,
            },
          },
        },
      });
      return chatRooms;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException('Chat rooms not found for the user');
      }
      throw error;
    }
  }

  async updateChatRoomName(chatRoomId: string, name: string) {
    try {
      return this.prisma.chatRooms.update({
        where: {
          id: chatRoomId,
        },
        data: {
          name,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new NotFoundException('Chat room not found');
      }
      throw error;
    }
  }

  async addParticipantsToChatRoom(chatRoomId: string, participantsId: string[]) {
    try {
      return await this.prisma.chatRooms.update({
        where: {
          id: chatRoomId,
        },
        data: {
          chatRoomParticipants: {
            createMany: {
              data: participantsId.map((id) => ({
                user_id: id,
              })),
            }
          }
        }
      })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Chat room not found');
        }
        else if (error.code === 'P2003') { 
          throw new NotFoundException('One or more participants not found');
        }
    }
      throw error;
    }
  }

  async removeParticipantsFromChatRoom(chatRoomId: string, participantsId: string[]) {
    try {
      return await this.prisma.chatRooms.update({
        where: {
          id: chatRoomId,
        },
        data: {
          chatRoomParticipants: {
            deleteMany: {
              user_id: {
                in: participantsId,
                },
              }
            }
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('Chat room not found');
        }
        else if (error.code === 'P2003') { 
          throw new NotFoundException('One or more participants not found');
        }
      }
    }
  }
}
