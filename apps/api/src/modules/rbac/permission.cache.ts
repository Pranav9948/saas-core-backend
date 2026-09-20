const rolePermissionCache = new Map<string, string[]>();

export const getCachedPermissions = (roleId: string) => {
  return rolePermissionCache.get(roleId);
};

export const setCachedPermissions = (roleId: string, permissions: string[]) => {
  rolePermissionCache.set(roleId, permissions);
};

export const clearPermissionCacheForRole = (roleId: string) => {
  rolePermissionCache.delete(roleId);
};

export const clearPermissionCache = () => {
  rolePermissionCache.clear();
};
