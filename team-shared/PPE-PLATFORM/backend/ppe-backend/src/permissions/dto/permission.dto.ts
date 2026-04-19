import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PermissionType, ResourceType } from './permission.entity';

export class CreateRoleDto {
  @ApiProperty({ description: '角色名', example: 'admin' })
  @IsString()
  @IsNotEmpty({ message: '角色名不能为空' })
  name: string;

  @ApiProperty({ description: '角色描述', example: '系统管理员', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ description: '角色名', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: '角色描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreatePermissionDto {
  @ApiProperty({ description: '权限名', example: 'user:read' })
  @IsString()
  @IsNotEmpty({ message: '权限名不能为空' })
  name: string;

  @ApiProperty({ description: '资源类型', enum: ResourceType })
  @IsEnum(ResourceType, { message: '无效的资源类型' })
  @IsNotEmpty({ message: '资源类型不能为空' })
  resource: ResourceType;

  @ApiProperty({ description: '操作类型', enum: PermissionType })
  @IsEnum(PermissionType, { message: '无效的操作类型' })
  @IsNotEmpty({ message: '操作类型不能为空' })
  action: PermissionType;

  @ApiProperty({ description: '权限描述', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class AssignPermissionsDto {
  @ApiProperty({ description: '权限 ID 列表', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要一个权限' })
  permissionIds: string[];
}

export class PermissionResponseDto {
  @ApiProperty({ description: '权限 ID' })
  id: string;

  @ApiProperty({ description: '权限名' })
  name: string;

  @ApiProperty({ description: '资源类型', enum: ResourceType })
  resource: ResourceType;

  @ApiProperty({ description: '操作类型', enum: PermissionType })
  action: PermissionType;

  @ApiProperty({ description: '权限描述' })
  description: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}

export class RoleResponseDto {
  @ApiProperty({ description: '角色 ID' })
  id: string;

  @ApiProperty({ description: '角色名' })
  name: string;

  @ApiProperty({ description: '角色描述' })
  description: string;

  @ApiProperty({ description: '权限列表', type: [PermissionResponseDto] })
  permissions: PermissionResponseDto[];

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;
}
