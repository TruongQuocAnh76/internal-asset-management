import { ApiProperty } from '@nestjs/swagger';
import { ChatRoomType } from '@prisma/client';

export class CreateChatRoomDto {
    @ApiProperty({
        description: 'Name of the chat room',
    })
    name: string;
    @ApiProperty({
        description: 'Type of the chat room',
    })
    type: ChatRoomType;
    @ApiProperty({
        description: 'List of participant IDs',
    })
    participantIds: string[];
}