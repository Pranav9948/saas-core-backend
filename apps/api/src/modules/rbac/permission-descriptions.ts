import { ALL_PERMISSIONS } from './permissions.constants.js';

const DESCRIPTIONS: Record<string, string> = {
  'member:create': 'Allows creating new gym members',
  'member:view': 'Allows viewing member profiles and lists',
  'member:update': 'Allows updating member information',
  'member:delete': 'Allows deactivating or removing members',
  'trainer:create': 'Allows promoting users to trainer profiles',
  'trainer:view': 'Allows viewing trainer profiles and rosters',
  'trainer:update': 'Allows updating trainer profiles',
  'trainer:delete': 'Allows removing trainer profiles',
  'attendance:mark': 'Allows marking member check-ins',
  'attendance:view': 'Allows viewing attendance records and history',
  'tenant:view': 'Allows viewing gym and subscription settings',
  'tenant:update': 'Allows updating gym settings and configuration',
  'user:invite': 'Allows inviting staff and admins to the gym',
  'user:update-role': 'Allows changing team member roles',
  'user:remove': 'Allows removing team members from the gym',
  'goal:create': 'Allows creating member fitness goals',
  'goal:view': 'Allows viewing member fitness goals',
  'role:create': 'Allows creating custom roles',
  'role:view': 'Allows viewing roles and permissions',
  'role:update': 'Allows updating custom roles and their permissions',
  'role:delete': 'Allows deleting custom roles',
};

export function getPermissionDescription(name: string): string {
  if (DESCRIPTIONS[name]) {
    return DESCRIPTIONS[name];
  }

  const [module, action] = name.split(':');
  return `Allows ${action ?? 'performing'} actions on ${module ?? name}`;
}

export function getAllPermissionSeedData() {
  return ALL_PERMISSIONS.map((name) => ({
    name,
    description: getPermissionDescription(name),
  }));
}
