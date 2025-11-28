// Role helper functions
export const isSuperAdmin = (role: { level?: number } | undefined): boolean => {
  if (!role) return false;
  return role.level === 99;
};

export const getRoleName = (role: { name: string } | undefined): string | null => {
  return role?.name || null;
};

