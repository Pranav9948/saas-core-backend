export const PERMISSIONS = {
  MEMBER_CREATE: 'member:create',
  MEMBER_VIEW: 'member:view',
  MEMBER_UPDATE: 'member:update',
  MEMBER_DELETE: 'member:delete',

  TRAINER_CREATE: 'trainer:create',
  TRAINER_VIEW: 'trainer:view',
  TRAINER_UPDATE: 'trainer:update',
  TRAINER_DELETE: 'trainer:delete',

  ATTENDANCE_MARK: 'attendance:mark',
  ATTENDANCE_VIEW: 'attendance:view',

  TENANT_UPDATE: 'tenant:update',
  TENANT_VIEW: 'tenant:view',

  USER_INVITE: 'user:invite',
  USER_UPDATE_ROLE: 'user:update-role',
  USER_REMOVE: 'user:remove',
} as const;

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
