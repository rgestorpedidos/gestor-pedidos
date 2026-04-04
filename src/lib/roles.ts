export const ROLES = {
  SUPERADMIN: 'SUPERADMIN',
  ADMIN: 'ADMIN',
  COZINHA: 'COZINHA',
  GARCOM: 'GARCOM',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ADMIN_ROLES: Role[] = [ROLES.SUPERADMIN, ROLES.ADMIN]
export const ALL_ROLES: Role[] = [ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.COZINHA, ROLES.GARCOM]
