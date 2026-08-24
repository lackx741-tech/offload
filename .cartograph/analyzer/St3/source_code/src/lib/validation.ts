/**
 * Zod schemas for input validation across API routes.
 */

import { z } from "zod";

const ethAddress = z.string().regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

export const createAffiliateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  payoutAddress: ethAddress,
  // accessSecret is auto-generated — not accepted from the caller
  telegramBotToken: z
    .string()
    .min(10, "Bot token too short")
    .regex(/^\d+:[\w-]+$/, "Invalid Telegram bot token format"),
  telegramChatId: z
    .string()
    .min(1, "Chat ID required")
    .regex(/^-?\d+$/, "Chat ID must be numeric"),
  notes: z.string().max(500).optional().default(""),
});

export const updateAffiliateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  payoutAddress: ethAddress.optional(),
  // accessSecret cannot be set manually — use the reset-password endpoint
  telegramBotToken: z.string().min(10).optional(),
  telegramChatId: z.string().min(1).optional(),
  status: z.enum(["pending", "active", "paused", "suspended"]).optional(),
  domains: z.array(z.string().max(253)).optional(),
  notes: z.string().max(500).optional(),
});

export type CreateAffiliateInput = z.infer<typeof createAffiliateSchema>;
export type UpdateAffiliateInput = z.infer<typeof updateAffiliateSchema>;
