import { z } from 'zod';

export const callWaiterSchema = z.object({
  reason: z.enum(['general', 'water', 'cutlery', 'clean_table'], {
    message: 'Please select a valid assistance reason',
  }),
  customNote: z
    .string()
    .max(100, 'Note must not exceed 100 characters')
    .optional(),
});

export type CallWaiterFormValues = z.infer<typeof callWaiterSchema>;

export const requestBillSchema = z.object({
  paymentMethod: z.enum(['card', 'apple_pay', 'cash', 'split'], {
    message: 'Please choose a payment method',
  }),
  splitCount: z.coerce
    .number()
    .min(2, 'Must split between at least 2 guests')
    .max(12, 'Maximum split is 12 guests'),
  customNote: z
    .string()
    .max(100, 'Note must not exceed 100 characters')
    .optional(),
});

export type RequestBillFormValues = z.infer<typeof requestBillSchema>;

export const tableSwitchSchema = z.object({
  tableId: z
    .string()
    .min(1, 'Table identifier is required')
    .max(12, 'Table identifier too long')
    .transform((val) => val.trim().toUpperCase()),
});

export type TableSwitchFormValues = z.infer<typeof tableSwitchSchema>;
