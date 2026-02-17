// Authentication & RBAC Types

export enum Role {
  ORG_ADMIN = 'ORG_ADMIN',           // Full access to all org resources
  PROJECT_ADMIN = 'PROJECT_ADMIN',   // Manage docs for assigned project(s)
  MEMBER = 'MEMBER',                 // Can view/upload
  VIEWER = 'VIEWER',                 // Read-only
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  type: 'cde' | 'sponsor' | 'investor' | 'admin';
}

export interface ProjectAssignment {
  projectId: string;
  projectName: string;
  role: 'admin' | 'member' | 'viewer';
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  organizationId: string;
  organization: Organization;
  projectAssignments: ProjectAssignment[];
  createdAt: string;
  lastLoginAt?: string;
}

export interface AuthContext {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Permission checks
  canViewDocument: (documentOwnerId: string, projectId?: string) => boolean;
  canEditDocument: (documentOwnerId: string, projectId?: string) => boolean;
  canDeleteDocument: (documentOwnerId: string) => boolean;
  canShareDocument: (documentOwnerId: string) => boolean;
  canUploadDocument: (projectId?: string) => boolean;
  canManageTeam: () => boolean;
  canManageSettings: () => boolean;
  
  // Project access
  hasProjectAccess: (projectId: string, requiredRole?: 'admin' | 'member' | 'viewer') => boolean;
}

// Role hierarchy for permission checks
export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ORG_ADMIN]: 100,
  [Role.PROJECT_ADMIN]: 75,
  [Role.MEMBER]: 50,
  [Role.VIEWER]: 25,
};

export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// Permission matrix
export const PERMISSIONS = {
  documents: {
    view: [Role.ORG_ADMIN, Role.PROJECT_ADMIN, Role.MEMBER, Role.VIEWER],
    create: [Role.ORG_ADMIN, Role.PROJECT_ADMIN, Role.MEMBER],
    edit: [Role.ORG_ADMIN, Role.PROJECT_ADMIN, Role.MEMBER],
    delete: [Role.ORG_ADMIN, Role.PROJECT_ADMIN],
    share: [Role.ORG_ADMIN, Role.PROJECT_ADMIN],
    manageVersions: [Role.ORG_ADMIN, Role.PROJECT_ADMIN, Role.MEMBER],
  },
  team: {
    view: [Role.ORG_ADMIN, Role.PROJECT_ADMIN, Role.MEMBER, Role.VIEWER],
    invite: [Role.ORG_ADMIN],
    remove: [Role.ORG_ADMIN],
    changeRoles: [Role.ORG_ADMIN],
  },
  settings: {
    view: [Role.ORG_ADMIN, Role.PROJECT_ADMIN],
    edit: [Role.ORG_ADMIN],
  },
  projects: {
    view: [Role.ORG_ADMIN, Role.PROJECT_ADMIN, Role.MEMBER, Role.VIEWER],
    create: [Role.ORG_ADMIN, Role.PROJECT_ADMIN],
    edit: [Role.ORG_ADMIN, Role.PROJECT_ADMIN],
    delete: [Role.ORG_ADMIN],
  },
} as const;

export function canPerform(
  userRole: Role, 
  resource: keyof typeof PERMISSIONS, 
  action: string
): boolean {
  const allowedRoles = (PERMISSIONS[resource] as Record<string, readonly Role[]>)[action];
  return allowedRoles?.includes(userRole) ?? false;
}
