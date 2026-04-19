/**
 * 反检测模块
 * 提供多种技术避免被反爬虫系统检测
 */
export interface AntiDetectionConfig {
    fingerprintSpoofing: boolean;
    hideWebDriver: boolean;
    hideAutomationFeatures: boolean;
    simulateMouseMovement: boolean;
    simulateScrolling: boolean;
    randomActionDelay: boolean;
    minActionDelay: number;
    maxActionDelay: number;
}
/**
 * 反检测管理器类
 */
export declare class AntiDetectionManager {
    private config;
    constructor(config?: Partial<AntiDetectionConfig>);
    /**
     * 应用所有反检测措施到页面
     */
    applyToPage(page: any): Promise<void>;
    /**
     * 隐藏 WebDriver 特征
     */
    private hideWebDriverFeatures;
    /**
     * 隐藏自动化指标
     */
    private hideAutomationIndicators;
    /**
     * 覆盖权限 API
     */
    private overridePermissions;
    /**
     * 模拟人类鼠标移动
     */
    simulateHumanMouseMovement(page: any, targetSelector: string): Promise<void>;
    /**
     * 模拟人类滚动行为
     */
    simulateHumanScrolling(page: any, distance?: number): Promise<void>;
    /**
     * 模拟人类点击
     */
    simulateHumanClick(page: any, selector: string): Promise<void>;
    /**
     * 模拟人类输入
     */
    simulateHumanTyping(page: any, selector: string, text: string): Promise<void>;
    /**
     * 生成贝塞尔曲线路径
     */
    private generateBezierPath;
    /**
     * 随机延迟
     */
    private randomDelay;
    /**
     * 模拟页面阅读时间
     */
    simulateReadingTime(page: any): Promise<void>;
}
export declare const antiDetectionManager: AntiDetectionManager;
//# sourceMappingURL=AntiDetection.d.ts.map