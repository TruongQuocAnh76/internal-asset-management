import { Injectable } from '@nestjs/common';
import { CreateMessageDto } from './dto/create-message.dto';
import { Prisma } from '@prisma/client';
import { CreateChatRoomDto } from './dto/create-chatroom.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { ChatRoomType } from '@prisma/client';
import {
  ChatRoomNotFoundError,
  DirectChatExistsError,
  MessageNotFoundError,
  ParticipantNotFoundError,
} from './errors';

const chatUserSelect = {
  id: true,
  first_name: true,
  last_name: true,
  username: true,
} as const;

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  async createChatRoom(body: CreateChatRoomDto, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    const sortedParticipantIds = [...body.participantIds].sort();
    const directKey =
      body.type === ChatRoomType.DIRECT
        ? sortedParticipantIds.join(':')
        : undefined;

    try {
      const chatRoom = await client.chatRooms.create({
        data: {
          name: body.name,
          type: body.type,
          direct_key: directKey,
          chatRoomParticipants: {
            createMany: {
              data: body.participantIds.map((id, index) => ({
                user_id: id,
              })),
            },
          },
        },
        include: {
          chatRoomParticipants: {
            include: {
              user: {
                select: chatUserSelect,
              },
            },
          },
        },
      });
      return chatRoom;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2003') {
          throw new ParticipantNotFoundError();
        } else if (error.code === 'P2002' && (error.meta?.target as string[])?.includes('direct_key')) {
          throw new DirectChatExistsError();
        }
      }
      throw error;
    }
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
        include: {
          sender: {
            select: chatUserSelect,
          },
        },
      });
      return message;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code == 'P2003'
      ) {
        if (body.chatRoomType === ChatRoomType.GROUP)
          throw new ChatRoomNotFoundError();

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
          include: {
            sender: {
              select: chatUserSelect,
            },
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
        throw new MessageNotFoundError();
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
        include: {
          sender: {
            select: chatUserSelect,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new MessageNotFoundError();
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
      take: Number(take) + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: [
        {
          created_at: 'desc',
        },
      ],
      include: {
        sender: {
          select: chatUserSelect,
        },
      },
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
        include: {
          chatRoomParticipants: {
            include: {
              user: {
                select: chatUserSelect,
              },
            },
          },
          messages: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
            include: {
              sender: {
                select: chatUserSelect,
              },
            },
          },
        },
      });

      return chatRooms.map(({ messages, ...room }) => ({
        ...room,
        lastMessage: messages[0],
      }));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new ChatRoomNotFoundError('Chat rooms not found for the user');
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
        throw new ChatRoomNotFoundError();
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
          throw new ChatRoomNotFoundError();
        } else if (error.code === 'P2003') {
          throw new ParticipantNotFoundError();
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
          throw new ChatRoomNotFoundError();
        } else if (error.code === 'P2003') {
          throw new ParticipantNotFoundError();
        }
      }
      throw error;
    }
  }
}
