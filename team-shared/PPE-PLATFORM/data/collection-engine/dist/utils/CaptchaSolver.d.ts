/**
 * 验证码处理器
 * 提供多种验证码识别和处理策略
 */
export interface CaptchaConfig {
    apiKey?: string;
    autoSolve: boolean;
    maxRetries: number;
    timeout: number;
    provider: '2captcha' | 'anticaptcha' | 'manual' | 'none';
}
export interface CaptchaResult {
    success: boolean;
    token?: string;
    error?: string;
    cost?: number;
    provider?: string;
}
/**
 * 验证码处理器类
 */
export declare class CaptchaSolver {
    private config;
    constructor(config?: Partial<CaptchaConfig>);
    /**
     * 检测页面是否存在验证码
     */
    detect(page: any): Promise<{
        detected: boolean;
        type?: 'recaptcha' | 'hcaptcha' | 'image' | 'slider' | 'click' | 'unknown';
        selector?: string;
    }>;
    /**
     * 解决验证码
     */
    solve(page: any, type: string): Promise<CaptchaResult>;
    /**
     * 解决 reCAPTCHA
     */
    private solveReCaptcha;
    /**
     * 解决 hCaptcha
     */
    private solveHCaptcha;
    /**
     * 解决图片验证码
     */
    private solveImageCaptcha;
    /**
     * 解决滑块验证码
     */
    private solveSliderCaptcha;
    /**
     * 使用 2Captcha 服务
     */
    private solveWith2Captcha;
    /**
     * 使用 Anti-Captcha 服务
     */
    private solveWithAntiCaptcha;
    /**
     * 在页面中填入验证码结果
     */
    fillResult(page: any, type: string, token: string): Promise<boolean>;
    /**
     * 休眠
     */
    private sleep;
}
export declare const captchaSolver: CaptchaSolver;
//# sourceMappingURL=CaptchaSolver.d.ts.map