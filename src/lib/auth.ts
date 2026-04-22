/**
 * 认证模块 - 简化导出
 * 
 * 提供便捷认证函数导入
 */

import { AuthUtils } from './auth-utils';

export { AuthUtils } from './auth-utils';
export { LoginSchema, RegisterSchema } from './auth-utils';

// 导出常用函数以便直接导入
export const getCurrentUser = () => AuthUtils.getCurrentUser();
export const isAuthenticated = () => AuthUtils.isAuthenticated();
export const validateLoginInput = (email: string, password: string) => AuthUtils.validateLoginInput(email, password);
