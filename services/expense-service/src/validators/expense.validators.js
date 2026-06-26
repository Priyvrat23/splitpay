import { z } from 'zod';

export const createExpenseSchema = z.object({
  description: z.string().min(1).max(255),
  amount: z.number().positive(),
  split_type: z.enum(['equal', 'exact', 'percentage']),
  splits: z.array(
    z.object({
      user_id: z.string().uuid(),
      amount: z.number().min(0),
    })
  ).optional(),
}).refine((data) => {
  if (data.split_type === 'equal') return true;
  return data.splits && data.splits.length > 0;
}, {
  message: 'splits array is required for exact and percentage split types',
});

export const createSettlementSchema = z.object({
  paid_to: z.string().uuid(),
  amount: z.number().positive(),
});