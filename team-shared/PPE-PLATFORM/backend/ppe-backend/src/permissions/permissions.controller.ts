import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsService } from './permissions.service';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto, AssignPermissionsDto } from './dto/permission.dto';

@ApiTags('permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  // ==================== 角色管理 ====================

  @Get('roles')
  @ApiOperation({ summary: '获取所有角色' })
  async findAllRoles() {
    return this.permissionsService.findAllRoles();
  }

  @Get('roles/:id')
  @ApiOperation({ summary: '根据 ID 获取角色' })
  async findRoleById(@Param('id') id: string) {
    return this.permissionsService.findRoleById(id);
  }

  @Post('roles')
  @ApiOperation({ summary: '创建角色' })
  async createRole(@Body() createRoleDto: CreateRoleDto) {
    return this.permissionsService.createRole(createRoleDto);
  }

  @Patch('roles/:id')
  @ApiOperation({ summary: '更新角色' })
  async updateRole(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto) {
    return this.permissionsService.updateRole(id, updateRoleDto);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除角色' })
  async deleteRole(@Param('id') id: string) {
    await this.permissionsService.deleteRole(id);
    return { message: '角色已删除' };
  }

  @Post('roles/:id/permissions')
  @ApiOperation({ summary: '为角色分配权限' })
  async assignPermissionsToRole(
    @Param('id') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.permissionsService.assignPermissionsToRole(roleId, assignPermissionsDto.permissionIds);
  }

  @Delete('roles/:id/permissions')
  @ApiOperation({ summary: '从角色移除权限' })
  async removePermissionsFromRole(
    @Param('id') roleId: string,
    @Body() assignPermissionsDto: AssignPermissionsDto,
  ) {
    return this.permissionsService.removePermissionsFromRole(roleId, assignPermissionsDto.permissionIds);
  }

  // ==================== 权限管理 ====================

  @Get()
  @ApiOperation({ summary: '获取所有权限' })
  async findAllPermissions() {
    return this.permissionsService.findAllPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取权限' })
  async findPermissionById(@Param('id') id: string) {
    return this.permissionsService.findPermissionById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建权限' })
  async createPermission(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.createPermission(createPermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除权限' })
  async deletePermission(@Param('id') id: string) {
    await this.permissionsService.deletePermission(id);
    return { message: '权限已删除' };
  }

  @Post('initialize')
  @ApiOperation({ summary: '初始化默认权限和角色' })
  async initializeDefaults() {
    await this.permissionsService.initializeDefaultPermissions();
    await this.permissionsService.initializeDefaultRoles();
    return { message: '默认权限和角色初始化完成' };
  }
}
