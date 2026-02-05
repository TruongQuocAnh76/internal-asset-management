import z from "zod";

export class GetAssetsParams {
  filter?: 'category' | 'status' | 'costs' | 'acquired_at';
  filter_value?: string;
  search?: string;
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const getAssetsParamsSchema = z.object({
  filter: z.enum(['category', 'status', 'costs', 'acquired_at']).optional(),
  filter_value: z.string().optional(),
  search: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Page must be a positive integer',
    })
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'Limit must be a positive integer',
    })
    .optional(),
});
