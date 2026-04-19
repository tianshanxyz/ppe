/**
 * User-Agent轮换器类
 */
export declare class UserAgentRotator {
    private userAgents;
    private currentIndex;
    /**
     * 添加User-Agent
     */
    addUserAgent(userAgent: string): void;
    /**
     * 批量添加User-Agent
     */
    addUserAgents(userAgents: string[]): void;
    /**
     * 获取随机User-Agent
     */
    getRandomUserAgent(): string;
    /**
     * 轮询获取User-Agent
     */
    getNextUserAgent(): string;
    /**
     * 获取User-Agent数量
     */
    getUserAgentCount(): number;
    /**
     * 从文件加载User-Agent列表
     */
    loadFromFile(filePath: string): void;
    /**
     * 获取特定浏览器的User-Agent
     */
    getUserAgentByBrowser(browser: 'chrome' | 'firefox' | 'safari' | 'edge'): string;
    /**
     * 获取特定操作系统的User-Agent
     */
    getUserAgentByOS(os: 'windows' | 'macos' | 'linux'): string;
}
export declare const userAgentRotator: UserAgentRotator;
//# sourceMappingURL=UserAgentRotator.d.ts.map