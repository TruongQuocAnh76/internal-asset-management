import { ApiProperty } from "@nestjs/swagger";
import { PurchaseRequestStatus } from "@prisma/client";
import z from "zod";

export class GetPurchaseRequestParam {
  @ApiProperty({
    description: 'Filter by status',
    example: 'SUBMITTED',
  })
  filter?: 'status';
  @ApiProperty({
    description: 'Value to filter by',
    example: 'SUBMITTED',
  })
  filterValue?: PurchaseRequestStatus;
  @ApiProperty({
    description: 'order of results',
    example: 'asc',
  })
  order?: 'asc' | 'desc';
  @ApiProperty({
    description: 'field to order results by',
    example: 'requested_at',
  })
  orderBy?: 'status' | 'requested_at';
  @ApiProperty({
    description: 'page number for pagination',
    example: 1,
  })
  page?: number;
  @ApiProperty({
    description: 'number of items per page',
    example: 20,
  })
  limit?: number;
}

export const getPurchaseRequestParamSchema = z.object({
  filter: z.enum(['status']).optional(),
  filterValue: z.enum([
    PurchaseRequestStatus.SUBMITTED,
    PurchaseRequestStatus.TL_APPROVED,
    PurchaseRequestStatus.BOD_APPROVED,
    PurchaseRequestStatus.REJECTED,
    PurchaseRequestStatus.RECEIVED,
  ]).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  orderBy: z.enum(['status', 'requested_at']).optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
});