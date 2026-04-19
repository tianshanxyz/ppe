"use strict";
/**
 * 数据验证器
 * 实现数据质量验证规则，确保采集数据的完整性和准确性
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataValidator = exports.DataValidator = void 0;
const Logger_1 = require("../utils/Logger");
/**
 * 数据验证器类
 */
class DataValidator {
    logger;
    constructor() {
        this.logger = new Logger_1.Logger('DataValidator');
    }
    /**
     * PPE产品验证规则
     */
    getProductValidationRules() {
        return [
            { field: 'productName', required: true, type: 'string', minLength: 2, maxLength: 500, message: '产品名称不能为空且长度应在2-500字符之间' },
            { field: 'productCode', required: true, type: 'string', minLength: 1, maxLength: 100, message: '产品代码不能为空' },
            { field: 'category', required: true, type: 'string', minLength: 1, message: '产品分类不能为空' },
            { field: 'ppeCategory', required: true, type: 'string', enum: ['Category I', 'Category II', 'Category III', 'Class I', 'Class II', 'Class III', '未知'], message: 'PPE类别无效' },
            { field: 'riskLevel', required: true, type: 'string', enum: ['low', 'medium', 'high', 'critical', '未知'], message: '风险等级无效' },
            { field: 'manufacturerName', required: true, type: 'string', minLength: 1, message: '制造商名称不能为空' },
            { field: 'dataSource', required: true, type: 'string', enum: ['FDA', 'EUDAMED', 'NMPA', 'PMDA', 'TGA', 'HealthCanada', '其他'], message: '数据源无效' },
            { field: 'sourceId', required: true, type: 'string', minLength: 1, message: '数据源ID不能为空' },
            { field: 'dataQualityScore', required: false, type: 'number', min: 0, max: 100, message: '数据质量评分应在0-100之间' },
            {
                field: 'description',
                required: false,
                type: 'string',
                custom: (value) => !value || value.length >= 10,
                message: '产品描述如果提供，应至少10个字符',
            },
        ];
    }
    /**
     * 制造商验证规则
     */
    getManufacturerValidationRules() {
        return [
            { field: 'companyName', required: true, type: 'string', minLength: 1, maxLength: 300, message: '制造商名称不能为空' },
            { field: 'country', required: true, type: 'string', minLength: 1, maxLength: 100, message: '国家不能为空' },
            { field: 'dataSource', required: false, type: 'string', message: '数据源不能为空' },
            { field: 'sourceId', required: false, type: 'string', minLength: 1, message: '数据源ID不能为空' },
            {
                field: 'email',
                required: false,
                type: 'string',
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: '邮箱格式无效',
            },
            {
                field: 'website',
                required: false,
                type: 'string',
                pattern: /^https?:\/\/.+/,
                message: '网站URL应以http://或https://开头',
            },
        ];
    }
    /**
     * 认证信息验证规则
     */
    getCertificationValidationRules() {
        return [
            { field: 'certificationNumber', required: false, type: 'string', minLength: 1, message: '认证编号不能为空' },
            { field: 'certificationType', required: true, type: 'string', minLength: 1, message: '认证类型不能为空' },
            { field: 'certBodyName', required: false, type: 'string', minLength: 1, message: '发证机构不能为空' },
            { field: 'issueDate', required: false, type: 'date', message: '发证日期不能为空' },
            { field: 'status', required: false, type: 'string', enum: ['active', 'expired', 'suspended', 'revoked', 'pending'], message: '认证状态无效' },
            { field: 'productId', required: false, type: 'string', minLength: 1, message: '产品ID不能为空' },
            {
                field: 'expiryDate',
                required: false,
                type: 'date',
                custom: (value, data) => {
                    if (!value || !data.issueDate)
                        return true;
                    return new Date(value) > new Date(data.issueDate);
                },
                message: '有效期应晚于发证日期',
            },
        ];
    }
    /**
     * 验证单个字段
     */
    validateField(value, rule, data) {
        // 必填检查
        if (rule.required && (value === undefined || value === null || value === '')) {
            return {
                valid: false,
                error: {
                    field: String(rule.field),
                    message: rule.message || `${String(rule.field)} 为必填项`,
                    value,
                    rule: 'required',
                },
            };
        }
        // 如果值为空且非必填，跳过其他验证
        if (!value && !rule.required) {
            return { valid: true };
        }
        // 类型检查
        if (rule.type) {
            const actualType = this.getValueType(value);
            if (actualType !== rule.type) {
                return {
                    valid: false,
                    error: {
                        field: String(rule.field),
                        message: `${String(rule.field)} 应为 ${rule.type} 类型，实际为 ${actualType}`,
                        value,
                        rule: 'type',
                    },
                };
            }
        }
        // 字符串长度检查
        if (rule.type === 'string' && typeof value === 'string') {
            if (rule.minLength !== undefined && value.length < rule.minLength) {
                return {
                    valid: false,
                    error: {
                        field: String(rule.field),
                        message: rule.message || `${String(rule.field)} 长度应至少 ${rule.minLength} 个字符`,
                        value,
                        rule: 'minLength',
                    },
                };
            }
            if (rule.maxLength !== undefined && value.length > rule.maxLength) {
                return {
                    valid: false,
                    error: {
                        field: String(rule.field),
                        message: rule.message || `${String(rule.field)} 长度应不超过 ${rule.maxLength} 个字符`,
                        value,
                        rule: 'maxLength',
                    },
                };
            }
        }
        // 正则表达式检查
        if (rule.pattern && typeof value === 'string') {
            if (!rule.pattern.test(value)) {
                return {
                    valid: false,
                    error: {
                        field: String(rule.field),
                        message: rule.message || `${String(rule.field)} 格式无效`,
                        value,
                        rule: 'pattern',
                    },
                };
            }
        }
        // 数值范围检查
        if (rule.type === 'number' && typeof value === 'number') {
            if (rule.min !== undefined && value < rule.min) {
                return {
                    valid: false,
                    error: {
                        field: String(rule.field),
                        message: rule.message || `${String(rule.field)} 应不小于 ${rule.min}`,
                        value,
                        rule: 'min',
                    },
                };
            }
            if (rule.max !== undefined && value > rule.max) {
                return {
                    valid: false,
                    error: {
                        field: String(rule.field),
                        message: rule.message || `${String(rule.field)} 应不大于 ${rule.max}`,
                        value,
                        rule: 'max',
                    },
                };
            }
        }
        // 枚举值检查
        if (rule.enum && !rule.enum.includes(value)) {
            return {
                valid: false,
                error: {
                    field: String(rule.field),
                    message: rule.message || `${String(rule.field)} 必须是以下值之一: ${rule.enum.join(', ')}`,
                    value,
                    rule: 'enum',
                },
            };
        }
        // 自定义验证
        if (rule.custom && !rule.custom(value, data)) {
            return {
                valid: false,
                error: {
                    field: String(rule.field),
                    message: rule.message || `${String(rule.field)} 验证失败`,
                    value,
                    rule: 'custom',
                },
            };
        }
        return { valid: true };
    }
    /**
     * 获取值的类型
     */
    getValueType(value) {
        if (value === null)
            return 'null';
        if (Array.isArray(value))
            return 'array';
        if (value instanceof Date)
            return 'date';
        return typeof value;
    }
    /**
     * 验证PPE产品
     */
    validateProduct(product) {
        const rules = this.getProductValidationRules();
        return this.validateObject(product, rules);
    }
    /**
     * 验证制造商
     */
    validateManufacturer(manufacturer) {
        const rules = this.getManufacturerValidationRules();
        return this.validateObject(manufacturer, rules);
    }
    /**
     * 验证认证信息
     */
    validateCertification(certification) {
        const rules = this.getCertificationValidationRules();
        return this.validateObject(certification, rules);
    }
    /**
     * 验证对象
     */
    validateObject(data, rules) {
        const errors = [];
        const warnings = [];
        for (const rule of rules) {
            const value = data[rule.field];
            const result = this.validateField(value, rule, data);
            if (!result.valid && result.error) {
                errors.push(result.error);
            }
        }
        // 添加警告（非必填字段的建议）
        this.addWarnings(data, warnings);
        // 计算质量评分
        const score = this.calculateScore(rules.length, errors.length, warnings.length);
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            score,
        };
    }
    /**
     * 添加警告
     */
    addWarnings(data, warnings) {
        const product = data;
        // 检查描述字段
        if (!product.description || product.description.length < 50) {
            warnings.push({
                field: 'description',
                message: '产品描述较短，建议提供更详细的描述信息',
                value: product.description,
                suggestion: '建议描述长度至少50个字符，包含产品用途、材料、规格等信息',
            });
        }
        // 检查制造商信息完整性
        if (!product.manufacturerAddress) {
            warnings.push({
                field: 'manufacturerAddress',
                message: '缺少制造商地址信息',
                suggestion: '建议补充制造商详细地址',
            });
        }
        // 检查标准信息
        if (!product.specifications || Object.keys(product.specifications).length === 0) {
            warnings.push({
                field: 'specifications',
                message: '未提供产品规格信息',
                suggestion: '建议补充产品规格参数',
            });
        }
        // 检查图片
        if (!product.images || product.images.length === 0) {
            warnings.push({
                field: 'images',
                message: '缺少产品图片',
                suggestion: '建议上传产品图片以提高数据质量',
            });
        }
    }
    /**
     * 计算质量评分
     */
    calculateScore(totalFields, errorCount, warningCount) {
        if (errorCount === 0 && warningCount === 0)
            return 100;
        const errorWeight = 10; // 每个错误扣10分
        const warningWeight = 2; // 每个警告扣2分
        let score = 100 - errorCount * errorWeight - warningCount * warningWeight;
        return Math.max(0, Math.min(100, score));
    }
    /**
     * 批量验证产品
     */
    validateProducts(products) {
        const results = new Map();
        let totalScore = 0;
        let validCount = 0;
        let invalidCount = 0;
        let warningCount = 0;
        const fieldCompleteness = {};
        const errorCounts = {};
        for (const product of products) {
            const result = this.validateProduct(product);
            const productId = product.id || product.sourceId || 'unknown';
            results.set(productId, result);
            totalScore += result.score;
            if (result.valid) {
                validCount++;
            }
            else {
                invalidCount++;
            }
            if (result.warnings.length > 0) {
                warningCount++;
            }
            // 统计字段完整度
            this.updateFieldCompleteness(product, fieldCompleteness);
            // 统计错误类型
            for (const error of result.errors) {
                const key = `${error.field}: ${error.message}`;
                errorCounts[key] = (errorCounts[key] || 0) + 1;
            }
        }
        // 计算字段完整度百分比
        const fieldCompletenessPercent = {};
        for (const [field, stats] of Object.entries(fieldCompleteness)) {
            fieldCompletenessPercent[field] = Math.round((stats.filled / stats.total) * 100);
        }
        // 排序常见错误
        const commonErrors = Object.entries(errorCounts)
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const metrics = {
            totalRecords: products.length,
            validRecords: validCount,
            invalidRecords: invalidCount,
            warningRecords: warningCount,
            averageScore: products.length > 0 ? Math.round(totalScore / products.length) : 0,
            fieldCompleteness: fieldCompletenessPercent,
            commonErrors,
        };
        return { results, metrics };
    }
    /**
     * 更新字段完整度统计
     */
    updateFieldCompleteness(product, stats) {
        const fields = ['productName', 'productCode', 'category', 'description', 'manufacturerName', 'manufacturerAddress', 'specifications', 'images'];
        for (const field of fields) {
            if (!stats[field]) {
                stats[field] = { filled: 0, total: 0 };
            }
            stats[field].total++;
            const value = product[field];
            if (value !== undefined && value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)) {
                stats[field].filled++;
            }
        }
    }
    /**
     * 生成验证报告
     */
    generateValidationReport(metrics) {
        const lines = [
            '=== 数据质量验证报告 ===',
            '',
            '总体统计:',
            `  - 总记录数: ${metrics.totalRecords}`,
            `  - 有效记录: ${metrics.validRecords} (${((metrics.validRecords / metrics.totalRecords) * 100).toFixed(1)}%)`,
            `  - 无效记录: ${metrics.invalidRecords} (${((metrics.invalidRecords / metrics.totalRecords) * 100).toFixed(1)}%)`,
            `  - 有警告记录: ${metrics.warningRecords}`,
            `  - 平均质量评分: ${metrics.averageScore}/100`,
            '',
            '字段完整度:',
        ];
        for (const [field, completeness] of Object.entries(metrics.fieldCompleteness)) {
            const bar = '█'.repeat(Math.round(completeness / 5)) + '░'.repeat(20 - Math.round(completeness / 5));
            lines.push(`  ${field.padEnd(25)} ${bar} ${completeness}%`);
        }
        if (metrics.commonErrors.length > 0) {
            lines.push('', '常见错误:');
            metrics.commonErrors.forEach((error, index) => {
                lines.push(`  ${index + 1}. ${error.error} (${error.count} 次)`);
            });
        }
        return lines.join('\n');
    }
    /**
     * 清洗数据
     */
    sanitizeProduct(product) {
        const sanitized = { ...product };
        // 清理字符串字段
        if (sanitized.productName) {
            sanitized.productName = sanitized.productName.trim().replace(/\s+/g, ' ');
        }
        if (sanitized.description) {
            sanitized.description = sanitized.description.trim();
        }
        if (sanitized.manufacturerName) {
            sanitized.manufacturerName = sanitized.manufacturerName.trim();
        }
        // 标准化空值
        if (sanitized.productName === '')
            sanitized.productName = 'Unknown Product';
        if (sanitized.category === '')
            sanitized.category = 'Uncategorized';
        // 确保日期格式正确
        if (sanitized.createdAt && !(sanitized.createdAt instanceof Date)) {
            sanitized.createdAt = new Date(sanitized.createdAt);
        }
        if (sanitized.updatedAt && !(sanitized.updatedAt instanceof Date)) {
            sanitized.updatedAt = new Date(sanitized.updatedAt);
        }
        // 标准化布尔值
        if (sanitized.isActive === undefined) {
            sanitized.isActive = true;
        }
        return sanitized;
    }
    /**
     * 验证数据源ID格式
     */
    validateSourceId(sourceId, dataSource) {
        const patterns = {
            FDA: /^K\d{6}$/,
            EUDAMED: /^[A-Z0-9]{20,}$/,
            NMPA: /^\d{10,}$/,
            PMDA: /^\d{6,}$/,
            TGA: /^\d{6}$/,
            HealthCanada: /^\d{6}$/,
        };
        const pattern = patterns[dataSource];
        if (!pattern)
            return true;
        return pattern.test(sourceId);
    }
}
exports.DataValidator = DataValidator;
// 导出单例实例
exports.dataValidator = new DataValidator();
//# sourceMappingURL=DataValidator.js.map