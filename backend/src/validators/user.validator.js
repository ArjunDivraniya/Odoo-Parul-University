const { z } = require('zod');

const userRoleSchema = z.enum(['EMPLOYEE', 'KITCHEN']);

const createUserSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email: z.string().trim().email('Valid email is required'),
  role: userRoleSchema,
});

const updateUserSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().email().optional(),
    role: userRoleSchema.optional(),
    isActive: z.boolean().optional(),
    password: z.string().min(8).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

module.exports = {
  createUserSchema,
  updateUserSchema,
};