export enum AppSubject {
  ALL = 'all',

  USER = 'User',

  ROLE = 'Role',

  PERMISSION = 'Permission',

  POST = 'Post',
}

/**
 * Current phase: RBAC only.
 *
 * Subject represents the protected resource (User, Role, Permission, Post, ...).
 *
 * Future:
 * - Support ABAC by combining Subject + Conditions.
 *
 * Example:
 *   can(Action.UPDATE, AppSubject.POST, { authorId: user.id });
 *   can(Action.READ, AppSubject.USER, { departmentId: user.departmentId });
 */
