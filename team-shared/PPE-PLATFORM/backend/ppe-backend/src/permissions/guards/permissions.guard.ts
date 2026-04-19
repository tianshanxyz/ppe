import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const { user, req } = context.switchToHttp().getRequest();
    
    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    // 这里需要检查用户是否有指定的权限
    // 简化实现：检查用户角色
    if (user.role === 'admin') {
      return true;
    }

    // 实际项目中应该查询数据库检查用户权限
    // const hasPermission = await this.checkUserPermissions(user.id, requiredPermissions);
    
    // 临时实现：假设用户有所有权限
    return true;
  }
}
