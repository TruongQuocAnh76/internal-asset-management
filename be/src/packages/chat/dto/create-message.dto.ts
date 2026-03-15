import { ApiAcceptedResponse, ApiProperty } from "@nestjs/swagger";
import { ChatRoomType, MessageType } from "@prisma/client";
import { z } from "zod";
export class CreateMessageDto {
    @ApiProperty({
        description: 'ID of the sender',
        example: 'user-123',
    })
    senderId: string;
    @ApiProperty({
        description: 'ID of the chat room',
        example: 'room-456',
    })
    chatRoomId: string;
    @ApiProperty({
        description: 'Content of the message',
        example: 'Hello, how are you?',
    })
    content: string;
    @ApiProperty({
        description: 'Type of the message',
        example: 'text',
    })
    type: MessageType;

    @ApiProperty({
        description: 'Type of the chat room',
    })
    chatRoomType: ChatRoomType;
}

export const CreateMessageDtoSchema = z.object({
    senderId: z.string(),
    chatRoomId: z.string(),
    content: z.string(),
    type: z.nativeEnum(MessageType),
    chatRoomType: z.nativeEnum(ChatRoomType),
})