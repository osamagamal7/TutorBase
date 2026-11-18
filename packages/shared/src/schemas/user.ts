import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.email(),
  name: z.string().min(2),
});

export type User = z.infer<typeof UserSchema>;
