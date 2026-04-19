/**
 * 数据验证器
 * 实现数据质量验证规则，确保采集数据的完整性和准确性
 */
import { PPEProduct, PPEManufacturer, PPECertification, DataSourceType } from '../types';
export interface ValidationRule<T> {
    field: keyof T;
    required?: boolean;
    type?: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
    enum?: any[];
    custom?: (value: any, data: T) => boolean;
    message?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
    score: number;
}
export interface ValidationError {
    field: string;
    message: string;
    value?: any;
    rule?: string;
}
export interface ValidationWarning {
    field: string;
    message: string;
    value?: any;
    suggestion?: string;
}
export interface DataQualityMetrics {
    totalRecords: number;
    validRecords: number;
    invalidRecords: number;
    warningRecords: number;
    averageScore: number;
    fieldCompleteness: Record<string, number>;
    commonErrors: Array<{
        error: string;
        count: number;
    }>;
}
/**
 * 数据验证器类
 */
export declare class DataValidator {
    private logger;
    constructor();
    /**
     * PPE产品验证规则
     */
    private getProductValidationRules;
    /**
     * 制造商验证规则
     */
    private getManufacturerValidationRules;
    /**
     * 认证信息验证规则
     */
    private getCertificationValidationRules;
    /**
     * 验证单个字段
     */
    private validateField;
    /**
     * 获取值的类型
     */
    private getValueType;
    /**
     * 验证PPE产品
     */
    validateProduct(product: PPEProduct): ValidationResult;
    /**
     * 验证制造商
     */
    validateManufacturer(manufacturer: PPEManufacturer): ValidationResult;
    /**
     * 验证认证信息
     */
    validateCertification(certification: PPECertification): ValidationResult;
    /**
     * 验证对象
     */
    private validateObject;
    /**
     * 添加警告
     */
    private addWarnings;
    /**
     * 计算质量评分
     */
    private calculateScore;
    /**
     * 批量验证产品
     */
    validateProducts(products: PPEProduct[]): {
        results: Map<string, ValidationResult>;
        metrics: DataQualityMetrics;
    };
    /**
     * 更新字段完整度统计
     */
    private updateFieldCompleteness;
    /**
     * 生成验证报告
     */
    generateValidationReport(metrics: DataQualityMetrics): string;
    /**
     * 清洗数据
     */
    sanitizeProduct(product: PPEProduct): PPEProduct;
    /**
     * 验证数据源ID格式
     */
    validateSourceId(sourceId: string, dataSource: DataSourceType): boolean;
}
export declare const dataValidator: DataValidator;
//# sourceMappingURL=DataValidator.d.ts.map