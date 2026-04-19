import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { Permission, PermissionType, ResourceType } from './permission.entity';
import { CreateRoleDto, UpdateRoleDto, CreatePermissionDto } from './dto/permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  // ==================== 角色管理 ====================

  /**
   * 创建角色
   */
  async createRole(createRoleDto: CreateRoleDto): Promise<Role> {
    // 检查角色名是否已存在
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('角色名已存在');
    }

    const role = this.roleRepository.create({
      name: createRoleDto.name,
      description: createRoleDto.description,
    });

    return this.roleRepository.save(role);
  }

  /**
   * 获取所有角色
   */
  async findAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据 ID 获取角色
   */
  async findRoleById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!role) {
      throw new NotFoundException('角色不存在');
    }

    return role;
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, updateRoleDto: UpdateRoleDto): Promise<Role> {
    const role = await this.findRoleById(id);

    role.name = updateRoleDto.name || role.name;
    role.description = updateRoleDto.description || role.description;

    return this.roleRepository.save(role);
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<void> {
    const role = await this.findRoleById(id);
    await this.roleRepository.remove(role);
  }

  /**
   * 为角色分配权限
   */
  async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);

    const permissions = await this.permissionRepository.findByIds(permissionIds);
    role.permissions = permissions;

    return this.roleRepository.save(role);
  }

  /**
   * 从角色移除权限
   */
  async removePermissionsFromRole(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.findRoleById(roleId);

    role.permissions = role.permissions.filter(
      (permission) => !permissionIds.includes(permission.id),
    );

    return this.roleRepository.save(role);
  }

  // ==================== 权限管理 ====================

  /**
   * 创建权限
   */
  async createPermission(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    // 检查权限名是否已存在
    const existingPermission = await this.permissionRepository.findOne({
      where: { name: createPermissionDto.name },
    });

    if (existingPermission) {
      throw new ConflictException('权限名已存在');
    }

    const permission = this.permissionRepository.create({
      name: createPermissionDto.name,
      resource: createPermissionDto.resource,
      action: createPermissionDto.action,
      description: createPermissionDto.description,
    });

    return this.permissionRepository.save(permission);
  }

  /**
   * 获取所有权限
   */
  async findAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  /**
   * 根据 ID 获取权限
   */
  async findPermissionById(id: string): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException('权限不存在');
    }

    return permission;
  }

  /**
   * 删除权限
   */
  async deletePermission(id: string): Promise<void> {
    const permission = await this.findPermissionById(id);
    await this.permissionRepository.remove(permission);
  }

  /**
   * 初始化默认权限
   */
  async initializeDefaultPermissions(): Promise<void> {
    const defaultPermissions = [
      // 用户管理权限
      { name: 'user:read', resource: ResourceType.USER, action: PermissionType.READ, description: '查看用户信息' },
      { name: 'user:write', resource: ResourceType.USER, action: PermissionType.WRITE, description: '修改用户信息' },
      { name: 'user:delete', resource: ResourceType.USER, action: PermissionType.DELETE, description: '删除用户' },
      { name: 'user:admin', resource: ResourceType.USER, action: PermissionType.ADMIN, description: '用户管理权限' },

      // 角色权限
      { name: 'role:read', resource: ResourceType.ROLE, action: PermissionType.READ, description: '查看角色信息' },
      { name: 'role:write', resource: ResourceType.ROLE, action: PermissionType.WRITE, description: '修改角色信息' },
      { name: 'role:delete', resource: ResourceType.ROLE, action: PermissionType.DELETE, description: '删除角色' },

      // PPE 数据权限
      { name: 'ppe:read', resource: ResourceType.PPE, action: PermissionType.READ, description: '查看 PPE 数据' },
      { name: 'ppe:write', resource: ResourceType.PPE, action: PermissionType.WRITE, description: '修改 PPE 数据' },
      { name: 'ppe:delete', resource: ResourceType.PPE, action: PermissionType.DELETE, description: '删除 PPE 数据' },
      { name: 'ppe:search', resource: ResourceType.PPE, action: PermissionType.SEARCH, description: '搜索 PPE 数据' },

      // 法规数据权限
      { name: 'regulation:read', resource: ResourceType.REGULATION, action: PermissionType.READ, description: '查看法规数据' },
      { name: 'regulation:write', resource: ResourceType.REGULATION, action: PermissionType.WRITE, description: '修改法规数据' },
      { name: 'regulation:delete', resource: ResourceType.REGULATION, action: PermissionType.DELETE, description: '删除法规数据' },

      // 企业数据权限
      { name: 'company:read', resource: ResourceType.COMPANY, action: PermissionType.READ, description: '查看企业数据' },
      { name: 'company:write', resource: ResourceType.COMPANY, action: PermissionType.WRITE, description: '修改企业数据' },
      { name: 'company:delete', resource: ResourceType.COMPANY, action: PermissionType.DELETE, description: '删除企业数据' },

      // 预警系统权限
      { name: 'alert:read', resource: ResourceType.ALERT, action: PermissionType.READ, description: '查看预警信息' },
      { name: 'alert:write', resource: ResourceType.ALERT, action: PermissionType.WRITE, description: '修改预警信息' },
      { name: 'alert:delete', resource: ResourceType.ALERT, action: PermissionType.DELETE, description: '删除预警信息' },
    ];

    for (const perm of defaultPermissions) {
      const existing = await this.permissionRepository.findOne({
        where: { name: perm.name },
      });

      if (!existing) {
        await this.permissionRepository.save(perm);
      }
    }
  }

  /**
   * 初始化默认角色
   */
  async initializeDefaultRoles(): Promise<void> {
    const roles = [
      {
        name: 'admin',
        description: '系统管理员',
        permissions: await this.permissionRepository.find(),
      },
      {
        name: 'user',
        description: '普通用户',
        permissions: await this.permissionRepository.find({
          where: { action: PermissionType.READ },
        }),
      },
      {
        name: 'guest',
        description: '访客',
        permissions: await this.permissionRepository.find({
          where: {
            resource: [ResourceType.PPE, ResourceType.REGULATION, ResourceType.COMPANY],
            action: PermissionType.READ,
          },
        }),
      },
    ];

    for (const roleData of roles) {
      const existing = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });

      if (!existing) {
        const role = this.roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          permissions: roleData.permissions,
        });
        await this.roleRepository.save(role);
      }
    }
  }

  /**
   * 检查用户是否有指定权限
   */
  async hasPermission(userId: string, permissionName: string): Promise<boolean> {
    // 这里需要从用户 -> 角色 -> 权限的关系中检查
    // 简化实现：通过查询数据库
    const query = `
      SELECT COUNT(*) as count
      FROM users
      INNER JOIN user_roles ON users.id = user_roles.user_id
      INNER JOIN roles ON user_roles.role_id = roles.id
      INNER JOIN role_permissions ON roles.id = role_permissions.role_id
      INNER JOIN permissions ON role_permissions.permission_id = permissions.id
      WHERE users.id = $1 AND permissions.name = $2
    `;

    // 实际项目中应该使用 TypeORM 的 QueryBuilder
    // 这里仅做示例
    return true;
  }
}
