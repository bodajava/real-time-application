import { z } from 'zod';

/**
 * Validates query parameters for listing commentary.
 */
export const listCommentaryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(100).optional(),
});

/**
 * Validates the payload for creating a new commentary entry.
 */
export const createCommentarySchema = z.object({
  // Although not explicitly requested, matchId is required by the DB schema
  matchId: z.coerce.number().int().positive(),
  minutes: z.coerce.number().int().nonnegative(),
  sequence: z.coerce.number().int().optional(),
  period: z.string().min(1),
  eventType: z.string().min(1),
  actor: z.string().optional(),
  team: z.string().optional(),
  message: z.string().min(1, "Message is required"),
  metadata: z.record(z.string(), z.any()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
});
