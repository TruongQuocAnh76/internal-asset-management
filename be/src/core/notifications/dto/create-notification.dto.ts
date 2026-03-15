import { ApiProperty } from "@nestjs/swagger";
import z from "zod";
import { NotificationType } from "@prisma/client";

export class CreateNotificationDto {
    @ApiProperty({
        description: 'The ID of the user to receive the notification',
    })
    userId: string;
    @ApiProperty({
        description: 'The content of the notification',
    })
    content: string;
    @ApiProperty({
        description: 'The type of the notification',
    })
    type: NotificationType;
}

export const CreateNotificationDtoSchema = z.object({
    userId: z.string(),
    content: z.string(),
    type: z.nativeEnum(NotificationType),
})