import { z } from 'zod';

export const TenantIdParamsSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid('Invalid tenant ID'),
  }),
});

export const RoleIdParamsSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid('Invalid tenant ID'),
    roleId: z.string().uuid('Invalid role ID'),
  }),
});

export const CreateRoleSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid('Invalid tenant ID'),
  }),
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Role name must be at least 2 characters')
      .max(50, 'Role name must be at most 50 characters'),
    permissionIds: z
      .array(z.string().uuid('Invalid permission ID'))
      .min(1, 'At least one permission is required'),
  }),
});

export const UpdateRoleSchema = z.object({
  params: z.object({
    tenantId: z.string().uuid('Invalid tenant ID'),
    roleId: z.string().uuid('Invalid role ID'),
  }),
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Role name must be at least 2 characters')
        .max(50, 'Role name must be at most 50 characters')
        .optional(),
      permissionIds: z
        .array(z.string().uuid('Invalid permission ID'))
        .min(1, 'At least one permission is required')
        .optional(),
    })
    .refine(
      (data) => data.name !== undefined || data.permissionIds !== undefined,
      {
        message: 'At least one field must be provided',
      },
    ),
});
