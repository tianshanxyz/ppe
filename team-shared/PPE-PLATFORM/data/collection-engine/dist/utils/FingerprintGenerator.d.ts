/**
 * 浏览器指纹生成器
 * 用于生成随机的浏览器指纹，避免被反爬虫系统识别
 */
export interface BrowserFingerprint {
    userAgent: string;
    viewport: {
        width: number;
        height: number;
        deviceScaleFactor: number;
    };
    screen: {
        width: number;
        height: number;
        colorDepth: number;
    };
    timezone: string;
    locale: string;
    languages: string[];
    platform: string;
    hardwareConcurrency: number;
    deviceMemory: number;
    webglVendor: string;
    webglRenderer: string;
    canvas: {
        noise: number;
    };
    fonts: string[];
    plugins: Array<{
        name: string;
        filename: string;
        description: string;
        version: string;
    }>;
    colorGamut: string;
    forcedColors: string;
    monochrome: number;
    contrast: number;
    reducedMotion: string;
    hdr: boolean;
}
/**
 * 浏览器指纹生成器类
 */
export declare class FingerprintGenerator {
    private readonly viewports;
    private readonly screens;
    private readonly timezones;
    private readonly locales;
    private readonly platforms;
    private readonly webglVendors;
    private readonly webglRenderers;
    private readonly commonFonts;
    private readonly plugins;
    /**
     * 生成随机整数
     */
    private randomInt;
    /**
     * 从数组中随机选择一个元素
     */
    private randomChoice;
    /**
     * 从数组中随机选择多个元素
     */
    private randomChoices;
    /**
     * 生成浏览器指纹
     */
    generate(): BrowserFingerprint;
    /**
     * 生成用户代理字符串
     */
    private generateUserAgent;
    /**
     * 生成语言列表
     */
    private generateLanguages;
    /**
     * 应用指纹到 Puppeteer 页面
     */
    applyToPage(page: any): Promise<void>;
    /**
     * 生成 WebDriver 隐藏脚本
     */
    getWebdriverHideScript(): string;
}
export declare const fingerprintGenerator: FingerprintGenerator;
//# sourceMappingURL=FingerprintGenerator.d.ts.map