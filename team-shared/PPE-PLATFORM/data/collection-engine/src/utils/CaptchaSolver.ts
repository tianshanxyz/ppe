/**
 * 验证码处理器
 * 提供多种验证码识别和处理策略
 */

export interface CaptchaConfig {
  // 2Captcha API 配置
  apiKey?: string;
  // 是否启用自动识别
  autoSolve: boolean;
  // 最大重试次数
  maxRetries: number;
  // 超时时间（毫秒）
  timeout: number;
  // 识别服务提供商
  provider: '2captcha' | 'anticaptcha' | 'manual' | 'none';
}

export interface CaptchaResult {
  success: boolean;
  token?: string;
  error?: string;
  cost?: number; // 识别成本（秒）
  provider?: string;
}

/**
 * 验证码处理器类
 */
export class CaptchaSolver {
  private config: CaptchaConfig;

  constructor(config?: Partial<CaptchaConfig>) {
    this.config = {
      autoSolve: false,
      maxRetries: 3,
      timeout: 120000,
      provider: 'none',
      ...config,
    };
  }

  /**
   * 检测页面是否存在验证码
   */
  async detect(page: any): Promise<{
    detected: boolean;
    type?: 'recaptcha' | 'hcaptcha' | 'image' | 'slider' | 'click' | 'unknown';
    selector?: string;
  }> {
    // 检测 reCAPTCHA
    const recaptchaFrame = await page.$('iframe[src*="recaptcha"]');
    if (recaptchaFrame) {
      return { detected: true, type: 'recaptcha', selector: 'iframe[src*="recaptcha"]' };
    }

    // 检测 hCaptcha
    const hcaptchaFrame = await page.$('iframe[src*="hcaptcha"]');
    if (hcaptchaFrame) {
      return { detected: true, type: 'hcaptcha', selector: 'iframe[src*="hcaptcha"]' };
    }

    // 检测图片验证码
    const imageCaptcha = await page.$('img[src*="captcha"], img[alt*="captcha"], .captcha-image, #captcha-image');
    if (imageCaptcha) {
      return { detected: true, type: 'image', selector: 'img[src*="captcha"]' };
    }

    // 检测滑块验证码
    const sliderCaptcha = await page.$('.slider-captcha, .slide-verify, [class*="slider"][class*="captcha"]');
    if (sliderCaptcha) {
      return { detected: true, type: 'slider', selector: '.slider-captcha' };
    }

    // 检测点击验证码
    const clickCaptcha = await page.$('.click-captcha, .point-captcha, [class*="click"][class*="captcha"]');
    if (clickCaptcha) {
      return { detected: true, type: 'click', selector: '.click-captcha' };
    }

    // 检测验证码关键词
    const pageContent = await page.content();
    const captchaKeywords = ['captcha', '验证码', '驗證碼', 'código de verificación'];
    if (captchaKeywords.some((kw) => pageContent.toLowerCase().includes(kw.toLowerCase()))) {
      return { detected: true, type: 'unknown' };
    }

    return { detected: false };
  }

  /**
   * 解决验证码
   */
  async solve(page: any, type: string): Promise<CaptchaResult> {
    switch (type) {
      case 'recaptcha':
        return this.solveReCaptcha(page);
      case 'hcaptcha':
        return this.solveHCaptcha(page);
      case 'image':
        return this.solveImageCaptcha(page);
      case 'slider':
        return this.solveSliderCaptcha(page);
      default:
        return { success: false, error: `不支持的验证码类型: ${type}` };
    }
  }

  /**
   * 解决 reCAPTCHA
   */
  private async solveReCaptcha(page: any): Promise<CaptchaResult> {
    if (!this.config.autoSolve || this.config.provider === 'none') {
      return {
        success: false,
        error: '自动验证码识别未启用',
      };
    }

    try {
      // 获取 site key
      const siteKey = await page.evaluate(() => {
        const element = document.querySelector('.g-recaptcha');
        return element?.getAttribute('data-sitekey');
      });

      if (!siteKey) {
        return { success: false, error: '无法获取 reCAPTCHA site key' };
      }

      const pageUrl = page.url();

      // 根据提供商调用相应服务
      switch (this.config.provider) {
        case '2captcha':
          return await this.solveWith2Captcha(siteKey, pageUrl, 'recaptcha');
        case 'anticaptcha':
          return await this.solveWithAntiCaptcha(siteKey, pageUrl, 'recaptcha');
        default:
          return { success: false, error: '未配置验证码识别服务' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 解决 hCaptcha
   */
  private async solveHCaptcha(page: any): Promise<CaptchaResult> {
    if (!this.config.autoSolve || this.config.provider === 'none') {
      return {
        success: false,
        error: '自动验证码识别未启用',
      };
    }

    try {
      const siteKey = await page.evaluate(() => {
        const element = document.querySelector('.h-captcha');
        return element?.getAttribute('data-sitekey');
      });

      if (!siteKey) {
        return { success: false, error: '无法获取 hCaptcha site key' };
      }

      const pageUrl = page.url();

      switch (this.config.provider) {
        case '2captcha':
          return await this.solveWith2Captcha(siteKey, pageUrl, 'hcaptcha');
        case 'anticaptcha':
          return await this.solveWithAntiCaptcha(siteKey, pageUrl, 'hcaptcha');
        default:
          return { success: false, error: '未配置验证码识别服务' };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 解决图片验证码
   */
  private async solveImageCaptcha(page: any): Promise<CaptchaResult> {
    try {
      // 截图验证码图片
      const captchaElement = await page.$('img[src*="captcha"], img[alt*="captcha"], .captcha-image');
      if (!captchaElement) {
        return { success: false, error: '未找到验证码图片元素' };
      }

      // 如果启用了自动识别，可以集成 OCR 服务
      if (this.config.autoSolve && this.config.provider !== 'none') {
        // 这里可以集成 OCR 服务如 Tesseract 或云 OCR API
        return { success: false, error: '图片验证码自动识别暂未实现' };
      }

      // 手动模式：等待用户输入
      return { success: false, error: '请手动输入验证码' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 解决滑块验证码
   */
  private async solveSliderCaptcha(page: any): Promise<CaptchaResult> {
    try {
      // 滑块验证码通常需要模拟人类滑动行为
      // 这里可以实现基于图像识别的自动滑动
      return { success: false, error: '滑块验证码自动识别暂未实现' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 使用 2Captcha 服务
   */
  private async solveWith2Captcha(
    siteKey: string,
    pageUrl: string,
    type: 'recaptcha' | 'hcaptcha'
  ): Promise<CaptchaResult> {
    if (!this.config.apiKey) {
      return { success: false, error: '未配置 2Captcha API Key' };
    }

    try {
      // 提交验证码任务
      const taskType = type === 'recaptcha' ? 'userrecaptcha' : 'hcaptcha';
      const submitUrl = `http://2captcha.com/in.php?key=${this.config.apiKey}&method=${taskType}&googlekey=${siteKey}&pageurl=${encodeURIComponent(
        pageUrl
      )}&json=1`;

      const submitResponse = await fetch(submitUrl);
      const submitData = await submitResponse.json();

      if (submitData.status !== 1) {
        return { success: false, error: `2Captcha 提交失败: ${submitData.request}` };
      }

      const captchaId = submitData.request;

      // 轮询获取结果
      const startTime = Date.now();
      while (Date.now() - startTime < this.config.timeout) {
        await this.sleep(5000);

        const resultUrl = `http://2captcha.com/res.php?key=${this.config.apiKey}&action=get&id=${captchaId}&json=1`;
        const resultResponse = await fetch(resultUrl);
        const resultData = await resultResponse.json();

        if (resultData.status === 1) {
          return {
            success: true,
            token: resultData.request,
            cost: (Date.now() - startTime) / 1000,
            provider: '2captcha',
          };
        }

        if (resultData.request !== 'CAPCHA_NOT_READY') {
          return { success: false, error: `2Captcha 识别失败: ${resultData.request}` };
        }
      }

      return { success: false, error: '验证码识别超时' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 使用 Anti-Captcha 服务
   */
  private async solveWithAntiCaptcha(
    siteKey: string,
    pageUrl: string,
    type: 'recaptcha' | 'hcaptcha'
  ): Promise<CaptchaResult> {
    if (!this.config.apiKey) {
      return { success: false, error: '未配置 Anti-Captcha API Key' };
    }

    try {
      // Anti-Captcha API 实现
      const taskType = type === 'recaptcha' ? 'RecaptchaV2TaskProxyless' : 'HCaptchaTaskProxyless';

      const createTaskResponse = await fetch('https://api.anti-captcha.com/createTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientKey: this.config.apiKey,
          task: {
            type: taskType,
            websiteURL: pageUrl,
            websiteKey: siteKey,
          },
        }),
      });

      const createTaskData = await createTaskResponse.json();

      if (createTaskData.errorId !== 0) {
        return { success: false, error: `Anti-Captcha 创建任务失败: ${createTaskData.errorDescription}` };
      }

      const taskId = createTaskData.taskId;

      // 轮询获取结果
      const startTime = Date.now();
      while (Date.now() - startTime < this.config.timeout) {
        await this.sleep(5000);

        const getResultResponse = await fetch('https://api.anti-captcha.com/getTaskResult', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientKey: this.config.apiKey,
            taskId,
          }),
        });

        const resultData = await getResultResponse.json();

        if (resultData.status === 'ready') {
          return {
            success: true,
            token: resultData.solution.gRecaptchaResponse || resultData.solution.token,
            cost: (Date.now() - startTime) / 1000,
            provider: 'anticaptcha',
          };
        }

        if (resultData.errorId !== 0) {
          return { success: false, error: `Anti-Captcha 识别失败: ${resultData.errorDescription}` };
        }
      }

      return { success: false, error: '验证码识别超时' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 在页面中填入验证码结果
   */
  async fillResult(page: any, type: string, token: string): Promise<boolean> {
    try {
      switch (type) {
        case 'recaptcha':
          await page.evaluate((gRecaptchaResponse: string) => {
            // 设置 reCAPTCHA 响应
            const responseElement = document.getElementById('g-recaptcha-response');
            if (responseElement) {
              (responseElement as any).value = gRecaptchaResponse;
            }

            // 触发自定义回调
            if (typeof (window as any).grecaptcha !== 'undefined') {
              (window as any).grecaptcha.getResponse = () => gRecaptchaResponse;
            }

            // 查找并触发回调函数
            const scripts = document.querySelectorAll('script');
            scripts.forEach((script) => {
              const text = script.textContent || '';
              const match = text.match(/data-callback="([^"]+)"/);
              if (match && match[1]) {
                const callback = (window as any)[match[1]];
                if (typeof callback === 'function') {
                  callback(gRecaptchaResponse);
                }
              }
            });
          }, token);
          return true;

        case 'hcaptcha':
          await page.evaluate((hCaptchaResponse: string) => {
            const responseElement = document.querySelector('[name="h-captcha-response"]');
            if (responseElement) {
              (responseElement as any).value = hCaptchaResponse;
            }
          }, token);
          return true;

        default:
          return false;
      }
    } catch (error) {
      console.error('填入验证码结果失败:', error);
      return false;
    }
  }

  /**
   * 休眠
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// 导出单例实例
export const captchaSolver = new CaptchaSolver();
