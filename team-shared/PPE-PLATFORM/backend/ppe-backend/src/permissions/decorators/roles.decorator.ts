import { SetMetadata } from '@nestjs/common';
import { Role } from '../role.entity';

export const ROLES_KEY = 'roles';

/**
 * 角色装饰器
 * 用于限制只有特定角色的用户才能访问
 * 
 * @example
 * @Roles('admin', 'manager')
 * @Get('admin-only')
 * async adminOnlyRoute() {
 *   // 只有 admin 或 manager 角色的用户可以访问
 * }
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
