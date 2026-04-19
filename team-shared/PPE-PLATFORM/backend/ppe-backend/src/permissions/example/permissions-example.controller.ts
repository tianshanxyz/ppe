import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { Roles } from './decorators/roles.decorator';
import { Permissions } from './decorators/permissions.decorator';

@ApiTags('example')
@Controller('example')
export class ExampleController {
  
  /**
   * 示例 1: 只需要认证即可访问
   */
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '受保护的路由 - 需要认证' })
  async protectedRoute() {
    return { message: '已认证用户可以访问' };
  }

  /**
   * 示例 2: 需要特定角色
   */
  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: '仅管理员可访问' })
  async adminOnlyRoute() {
    return { message: '只有 admin 角色可以访问' };
  }

  /**
   * 示例 3: 需要多个角色之一
   */
  @Get('admin-or-manager')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'manager')
  @ApiOperation({ summary: '管理员或经理可访问' })
  async adminOrManagerRoute() {
    return { message: 'admin 或 manager 角色可以访问' };
  }

  /**
   * 示例 4: 需要特定权限
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:read')
  @ApiOperation({ summary: '需要用户读取权限' })
  async getUsers() {
    return { message: '有 user:read 权限的用户可以访问' };
  }

  /**
   * 示例 5: 需要多个权限之一
   */
  @Post('users')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:write', 'user:admin')
  @ApiOperation({ summary: '需要用户写入或管理权限' })
  async createUser() {
    return { message: '有 user:write 或 user:admin 权限的用户可以访问' };
  }

  /**
   * 示例 6: 组合使用角色和权限
   */
  @Get('sensitive-data')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles('admin')
  @Permissions('user:admin', 'ppe:admin')
  @ApiOperation({ summary: '需要管理员角色和特定权限' })
  async getSensitiveData() {
    return { message: '需要 admin 角色和特定权限才能访问' };
  }
}
