import { ApiProperty } from "@nestjs/swagger";
import { PurchaseRequestStatus } from "@prisma/client";
import z from "zod";
import { Prisma } from "@prisma/client";

export class CreatePurchaseRequestDto {
    @ApiProperty({
        description: 'ID of the category for the purchase request',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    requested_by: string;
    @ApiProperty({
        description: 'ID of the category for the purchase request',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    category_id: string;
    @ApiProperty({
        description: 'Reason for the purchase request',
        example: 'Need new laptops for team members',
    })
    reason?: string;
    @ApiProperty({
        description: 'Estimated cost of the purchase request',
        example: 1000,
    })
    estimatedCost: bigint;
    @ApiProperty({
        description: 'Quantity of items to purchase',
        example: 5,
    })
    quantity?: number;
    @ApiProperty({
        description: 'Status of the purchase request',
        example: 'SUBMITTED',
    })
    status?: PurchaseRequestStatus;
    specs?: Prisma.InputJsonValue;
}

export const CreatePurchaseRequestDtoSchema = {
    requested_by: z.string().uuid(),
    category_id: z.string().uuid(),
    reason: z.string().optional(),
    estimatedCost: z.bigint(),
    quantity: z.number().optional(),
    status: z.enum(PurchaseRequestStatus).optional(),
    specs: z.json(),
} as const;