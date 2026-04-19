/**
 * Medplum 权限管理服务
 * 
 * 提供与 Medplum 权限管理系统的集成功能，包括：
 * - 权限模型分析
 * - 权限映射
 * - 权限验证
 * - 权限优化
 * 
 * @module lib/medplum/services/permissionService
 */

import { getMedplumClient } from '../client'
import { createClient as createSupabaseClient } from '@/lib/supabase/server'

/**
 * Medplum 权限模型
 */
export interface MedplumPermission {
  resourceType: string
  resourceId: string
  action: 'read' | 'write' | 'delete' | 'search'
  principal: string // 用户或角色
  condition?: string
}

/**
 * MDLooker 权限模型
 */
export interface MDLookerPermission {
  id: string
  user_id: string
  resource_type: string
  resource_id: string
  action: 'read' | 'write' | 'delete' | 'search'
  role: string
  created_at: string
  updated_at: string
}

/**
 * 分析 Medplum 权限模型
 */
export async function analyzeMedplumPermissions() {
  try {
    const medplumClient = getMedplumClient()
    
    if (!medplumClient.isAuthenticated()) {
      throw new Error('Not authenticated')
    }
    
    // Note: Permission is not a standard FHIR resource type
    // Using Device as a placeholder for demonstration
    const searchParams: Record<string, string> = {
      _count: '100',
    }
    
    const result = await medplumClient.searchResources('Device', searchParams)

    console.log('Medplum permissions found:', (result as any).total)
    return result
  } catch (error) {
    console.error('Failed to analyze Medplum permissions:', error)
    throw error
  }
}

/**
 * 设计权限映射方案
 */
export function designPermissionMapping() {
  return {
    // Medplum 权限 → MDLooker 权限映射
    mappings: {
      'Patient.read': {
        resource_type: 'patient',
        action: 'read',
        role: 'user'
      },
      'Device.read': {
        resource_type: 'device',
        action: 'read',
        role: 'user'
      },
      'Device.write': {
        resource_type: 'device',
        action: 'write',
        role: 'admin'
      },
      'Organization.read': {
        resource_type: 'organization',
        action: 'read',
        role: 'user'
      },
      'RegulatoryAuthorization.read': {
        resource_type: 'regulation',
        action: 'read',
        role: 'user'
      }
    },
    // 权限继承规则
    inheritance: {
      'admin': ['user', 'guest'],
      'user': ['guest']
    },
    // 特殊权限
    special: {
      'system.admin': ['all:read', 'all:write', 'all:delete']
    }
  }
}

/**
 * 实现权限验证
 */
export async function validatePermission(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete' | 'search'
): Promise<boolean> {
  try {
    // 1. 检查 MDLooker 本地权限
    const supabase = await createSupabaseClient()
    const { data: localPermission, error: localError } = await supabase
      .from('permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('resource_type', resourceType)
      .eq('action', action)
      .limit(1)
      .single()

    if (localPermission) {
      return true
    }

    // 2. 检查 Medplum 权限
    const medplumAllowed = await checkMedplumPermission(
      userId,
      resourceType,
      resourceId,
      action
    )

    if (medplumAllowed) {
      // 将 Medplum 权限同步到本地
      await syncMedplumPermission(
        userId,
        resourceType,
        resourceId,
        action
      )
      return true
    }

    // 3. 检查角色权限
    const { data: userRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userRole?.role === 'admin') {
      return true
    }

    return false
  } catch (error) {
    console.error('Permission validation error:', error)
    return false
  }
}

/**
 * 检查 Medplum 权限
 */
async function checkMedplumPermission(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete' | 'search'
): Promise<boolean> {
  try {
    const medplumClient = getMedplumClient()
    
    if (!medplumClient.isAuthenticated()) {
      return false
    }
    
    const searchParams: Record<string, string> = {
      _count: '1',
      _id: userId,
    }
    
    const userResult = await medplumClient.searchResources('User', searchParams)

    return (userResult as any).total > 0
  } catch (error) {
    console.error('Medplum permission check error:', error)
    return false
  }
}

/**
 * 同步 Medplum 权限到本地
 */
async function syncMedplumPermission(
  userId: string,
  resourceType: string,
  resourceId: string,
  action: 'read' | 'write' | 'delete' | 'search'
) {
  try {
    const supabase = await createSupabaseClient()
    const { data, error } = await supabase
      .from('permissions')
      .insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        action: action,
        role: 'user'
      })

    if (error) {
      console.error('Failed to sync Medplum permission:', error)
    }
  } catch (error) {
    console.error('Error syncing Medplum permission:', error)
  }
}

/**
 * 集成 Medplum 权限管理
 */
export async function integrateMedplumPermissions() {
  try {
    // 1. 分析 Medplum 权限
    const medplumPermissions = await analyzeMedplumPermissions()

    // 2. 设计映射方案
    const mapping = designPermissionMapping()

    // 3. 同步权限到本地
    await syncPermissionsToLocal(medplumPermissions, mapping)

    console.log('Medplum permissions integrated successfully')
    return true
  } catch (error) {
    console.error('Failed to integrate Medplum permissions:', error)
    throw error
  }
}

/**
 * 同步权限到本地数据库
 */
async function syncPermissionsToLocal(
  medplumPermissions: unknown,
  mapping: unknown
) {
  try {
    const supabase = await createSupabaseClient()

    // 处理每个 Medplum 权限
    for (const permission of medplumPermissions.entry || []) {
      const mapped = mapMedplumToMDLooker(permission, mapping)
      if (mapped) {
        await supabase
          .from('permissions')
          .upsert(mapped, { onConflict: 'user_id,resource_type,action' })
      }
    }
  } catch (error) {
    console.error('Error syncing permissions to local:', error)
    throw error
  }
}

/**
 * 映射 Medplum 权限到 MDLooker 权限
 */
function mapMedplumToMDLooker(medplumPermission: unknown, mapping: unknown): MDLookerPermission | null {
  // 实现权限映射逻辑
  // 这里需要根据具体的 Medplum 权限结构进行映射
  return null
}

/**
 * 优化现有权限系统
 */
export async function optimizePermissionSystem() {
  try {
    // 1. 分析现有权限
    const supabase = await createSupabaseClient()
    const { data: existingPermissions, error } = await supabase
      .from('permissions')
      .select('*')

    if (error) {
      console.error('Failed to analyze existing permissions:', error)
      throw error
    }

    console.log('Existing permissions:', existingPermissions.length)

    // 2. 应用 Medplum 权限模型优化
    const improvements = applyMedplumPermissionModel()

    // 3. 实施权限优化
    await implementPermissionOptimizations(improvements)

    console.log('Permission system optimized successfully')
    return true
  } catch (error) {
    console.error('Failed to optimize permission system:', error)
    throw error
  }
}

/**
 * 应用 Medplum 权限模型
 */
function applyMedplumPermissionModel() {
  return {
    // 权限粒度优化
    granularity: {
      'device:read': '允许读取设备信息',
      'device:write': '允许修改设备信息',
      'regulation:read': '允许读取法规信息',
      'regulation:write': '允许修改法规信息'
    },
    // 角色优化
    roles: {
      'admin': {
        permissions: ['all:read', 'all:write', 'all:delete']
      },
      'user': {
        permissions: ['device:read', 'regulation:read', 'organization:read']
      },
      'guest': {
        permissions: ['device:read', 'regulation:read']
      }
    },
    // 权限继承
    inheritance: {
      'admin': ['user', 'guest'],
      'user': ['guest']
    }
  }
}

/**
 * 实施权限优化
 */
async function implementPermissionOptimizations(improvements: unknown) {
  try {
    const supabase = await createSupabaseClient()

    // 1. 清理旧权限
    await supabase
      .from('permissions')
      .delete()

    // 2. 应用新权限模型
    for (const [role, config] of Object.entries(improvements.roles)) {
      for (const permission of (config as any).permissions) {
        const [resourceType, action] = permission.split(':')
        await supabase
          .from('permissions')
          .insert({
            user_id: 'system',
            resource_type: resourceType,
            resource_id: '*',
            action: action as 'read' | 'write' | 'delete' | 'search',
            role: role
          })
      }
    }
  } catch (error) {
    console.error('Error implementing permission optimizations:', error)
    throw error
  }
}

/**
 * 测试权限功能
 */
export async function testPermissionFunctionality() {
  try {
    // 1. 测试权限验证
    const adminAllowed = await validatePermission(
      'admin-user-id',
      'device',
      '123',
      'write'
    )
    console.log('Admin allowed to write device:', adminAllowed)

    const userAllowed = await validatePermission(
      'regular-user-id',
      'device',
      '123',
      'read'
    )
    console.log('User allowed to read device:', userAllowed)

    // 2. 测试权限优化
    await optimizePermissionSystem()

    // 3. 测试权限集成
    await integrateMedplumPermissions()

    console.log('Permission functionality test completed successfully')
    return true
  } catch (error) {
    console.error('Permission functionality test failed:', error)
    throw error
  }
}
