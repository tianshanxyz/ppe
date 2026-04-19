import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * 权限装饰器
 * 用于限制只有特定权限的用户才能访问
 * 
 * @example
 * @Permissions('user:read', 'user:write')
 * @Get('users')
 * async getUsers() {
 *   // 需要有 user:read 或 user:write 权限
 * }
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
