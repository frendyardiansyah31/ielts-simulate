import { z } from "zod";

export const createAttemptSchema = z.object({
  test_id: z.string().uuid(),
});

export type CreateAttemptInput = z.infer<typeof createAttemptSchema>;
