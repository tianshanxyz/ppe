/**
 * 反检测模块
 * 提供多种技术避免被反爬虫系统检测
 */

import { fingerprintGenerator } from './FingerprintGenerator';

export interface AntiDetectionConfig {
  // 浏览器指纹伪装
  fingerprintSpoofing: boolean;
  // WebDriver 隐藏
  hideWebDriver: boolean;
  // 自动化特征隐藏
  hideAutomationFeatures: boolean;
  // 鼠标移动模拟
  simulateMouseMovement: boolean;
  // 滚动行为模拟
  simulateScrolling: boolean;
  // 随机操作延迟
  randomActionDelay: boolean;
  minActionDelay: number;
  maxActionDelay: number;
}

/**
 * 反检测管理器类
 */
export class AntiDetectionManager {
  private config: AntiDetectionConfig;

  constructor(config?: Partial<AntiDetectionConfig>) {
    this.config = {
      fingerprintSpoofing: true,
      hideWebDriver: true,
      hideAutomationFeatures: true,
      simulateMouseMovement: true,
      simulateScrolling: true,
      randomActionDelay: true,
      minActionDelay: 100,
      maxActionDelay: 500,
      ...config,
    };
  }

  /**
   * 应用所有反检测措施到页面
   */
  async applyToPage(page: any): Promise<void> {
    // 应用浏览器指纹
    if (this.config.fingerprintSpoofing) {
      await fingerprintGenerator.applyToPage(page);
    }

    // 隐藏 WebDriver 特征
    if (this.config.hideWebDriver) {
      await this.hideWebDriverFeatures(page);
    }

    // 隐藏自动化特征
    if (this.config.hideAutomationFeatures) {
      await this.hideAutomationIndicators(page);
    }

    // 覆盖权限 API
    await this.overridePermissions(page);
  }

  /**
   * 隐藏 WebDriver 特征
   */
  private async hideWebDriverFeatures(page: any): Promise<void> {
    const script = fingerprintGenerator.getWebdriverHideScript();
    await page.evaluateOnNewDocument(script);

    // 额外的 WebDriver 隐藏
    await page.evaluateOnNewDocument(() => {
      // 覆盖 navigator.webdriver
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      // 删除 __webdriver_script_fn
      delete (window as any).__webdriver_script_fn;

      // 覆盖 chrome 对象
      if (!(window as any).chrome) {
        (window as any).chrome = {};
      }

      // 添加 chrome.runtime
      if (!(window as any).chrome.runtime) {
        (window as any).chrome.runtime = {
          OnInstalledReason: {
            CHROME_UPDATE: 'chrome_update',
            INSTALL: 'install',
            SHARED_MODULE_UPDATE: 'shared_module_update',
            UPDATE: 'update',
          },
          OnRestartRequiredReason: {
            APP_UPDATE: 'app_update',
            OS_UPDATE: 'os_update',
            PERIODIC: 'periodic',
          },
          PlatformArch: {
            ARM: 'arm',
            ARM64: 'arm64',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          PlatformNaclArch: {
            ARM: 'arm',
            MIPS: 'mips',
            MIPS64: 'mips64',
            MIPS64EL: 'mips64el',
            MIPS_EL: 'mipsel',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          PlatformOs: {
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            MAC: 'mac',
            OPENBSD: 'openbsd',
            WIN: 'win',
          },
          RequestUpdateCheckStatus: {
            NO_UPDATE: 'no_update',
            THROTTLED: 'throttled',
            UPDATE_AVAILABLE: 'update_available',
          },
        };
      }

      // 覆盖 permissions.query
      const originalQuery = window.navigator.permissions?.query;
      if (originalQuery) {
        window.navigator.permissions.query = function (parameters: any) {
          if (parameters.name === 'notifications') {
            return Promise.resolve({
              name: 'notifications',
              state: Notification.permission,
              onchange: null,
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => true,
            } as unknown as PermissionStatus);
          }
          return originalQuery.call(window.navigator.permissions, parameters);
        };
      }
    });
  }

  /**
   * 隐藏自动化指标
   */
  private async hideAutomationIndicators(page: any): Promise<void> {
    await page.evaluateOnNewDocument(() => {
      // 覆盖 Notification.permission
      const originalNotification = window.Notification;
      if (originalNotification) {
        Object.defineProperty(window, 'Notification', {
          get: function () {
            return originalNotification;
          },
          set: function () {},
        });

        Object.defineProperty(Notification, 'permission', {
          get: () => 'default',
        });
      }

      // 覆盖 navigator.plugins 长度检测
      Object.defineProperty(navigator, 'plugins', {
        get: function () {
          return [
            {
              0: {
                type: 'application/x-google-chrome-pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: {},
              },
              description: 'Portable Document Format',
              filename: 'internal-pdf-viewer',
              length: 1,
              name: 'Chrome PDF Plugin',
              item: function () {
                return this[0];
              },
              namedItem: function () {
                return this[0];
              },
            },
            {
              0: {
                type: 'application/pdf',
                suffixes: 'pdf',
                description: 'Portable Document Format',
                enabledPlugin: {},
              },
              description: 'Portable Document Format',
              filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
              length: 1,
              name: 'Chrome PDF Viewer',
              item: function () {
                return this[0];
              },
              namedItem: function () {
                return this[0];
              },
            },
          ];
        },
      });

      // 覆盖 navigator.mimeTypes
      Object.defineProperty(navigator, 'mimeTypes', {
        get: function () {
          return [
            {
              type: 'application/pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: {},
            },
            {
              type: 'application/x-google-chrome-pdf',
              suffixes: 'pdf',
              description: 'Portable Document Format',
              enabledPlugin: {},
            },
          ];
        },
      });

      // 覆盖 CanvasRenderingContext2D.getImageData
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function (
        x: number,
        y: number,
        w: number,
        h: number
      ) {
        const imageData = originalGetImageData.call(this, x, y, w, h);
        // 添加微小噪声
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          const noise = (Math.random() - 0.5) * 0.5;
          data[i] = Math.min(255, Math.max(0, data[i] + noise));
          data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
          data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
        }
        return imageData;
      };

      // 覆盖 WebGL 参数获取
      const getParameterProxyHandler = {
        apply: function (target: any, thisArg: any, args: any[]) {
          const param = args[0];
          // UNMASKED_VENDOR_WEBGL
          if (param === 37445) {
            return 'Intel Inc.';
          }
          // UNMASKED_RENDERER_WEBGL
          if (param === 37446) {
            return 'Intel Iris OpenGL Engine';
          }
          return target.apply(thisArg, args);
        },
      };

      const getParameterProxy = new Proxy(
        WebGLRenderingContext.prototype.getParameter,
        getParameterProxyHandler
      );
      WebGLRenderingContext.prototype.getParameter = getParameterProxy;

      // 覆盖 toString 方法
      const originalToString = Function.prototype.toString;
      Function.prototype.toString = function () {
        if (this === Function.prototype.toString) {
          return 'function toString() { [native code] }';
        }
        if (this === CanvasRenderingContext2D.prototype.getImageData) {
          return 'function getImageData() { [native code] }';
        }
        if (this === WebGLRenderingContext.prototype.getParameter) {
          return 'function getParameter() { [native code] }';
        }
        return originalToString.call(this);
      };
    });
  }

  /**
   * 覆盖权限 API
   */
  private async overridePermissions(page: any): Promise<void> {
    const context = page.browserContext();
    if (context && context.overridePermissions) {
      await context.overridePermissions(page.url(), [
        'notifications',
        'geolocation',
        'camera',
        'microphone',
      ]);
    }
  }

  /**
   * 模拟人类鼠标移动
   */
  async simulateHumanMouseMovement(
    page: any,
    targetSelector: string
  ): Promise<void> {
    if (!this.config.simulateMouseMovement) return;

    const element = await page.$(targetSelector);
    if (!element) return;

    const box = await element.boundingBox();
    if (!box) return;

    // 计算目标点（元素中心）
    const targetX = box.x + box.width / 2;
    const targetY = box.y + box.height / 2;

    // 获取当前鼠标位置
    const currentPos = await page.evaluate(() => ({
      x: (window as any).lastMouseX || 0,
      y: (window as any).lastMouseY || 0,
    }));

    // 生成贝塞尔曲线路径
    const points = this.generateBezierPath(
      currentPos.x,
      currentPos.y,
      targetX,
      targetY,
      10 + Math.floor(Math.random() * 10)
    );

    // 执行移动
    for (const point of points) {
      await page.mouse.move(point.x, point.y);
      await this.randomDelay(10, 30);
    }

    // 记录最后位置
    await page.evaluate(
      (x: number, y: number) => {
        (window as any).lastMouseX = x;
        (window as any).lastMouseY = y;
      },
      targetX,
      targetY
    );
  }

  /**
   * 模拟人类滚动行为
   */
  async simulateHumanScrolling(page: any, distance?: number): Promise<void> {
    if (!this.config.simulateScrolling) return;

    const scrollDistance = distance || 300 + Math.floor(Math.random() * 400);
    const steps = 5 + Math.floor(Math.random() * 5);
    const stepDistance = scrollDistance / steps;

    for (let i = 0; i < steps; i++) {
      const actualStep = stepDistance * (0.8 + Math.random() * 0.4);
      await page.evaluate((y: number) => {
        window.scrollBy(0, y);
      }, actualStep);
      await this.randomDelay(50, 150);
    }

    // 随机回滚一点（人类行为）
    if (Math.random() > 0.7) {
      const rollback = scrollDistance * (0.1 + Math.random() * 0.2);
      await page.evaluate((y: number) => {
        window.scrollBy(0, -y);
      }, rollback);
    }
  }

  /**
   * 模拟人类点击
   */
  async simulateHumanClick(page: any, selector: string): Promise<void> {
    if (this.config.simulateMouseMovement) {
      await this.simulateHumanMouseMovement(page, selector);
    }

    // 随机延迟
    await this.randomDelay(
      this.config.minActionDelay,
      this.config.maxActionDelay
    );

    // 执行点击
    await page.click(selector, {
      delay: 50 + Math.floor(Math.random() * 100),
    });

    // 点击后随机延迟
    await this.randomDelay(100, 300);
  }

  /**
   * 模拟人类输入
   */
  async simulateHumanTyping(
    page: any,
    selector: string,
    text: string
  ): Promise<void> {
    await this.simulateHumanClick(page, selector);

    // 逐个字符输入，带随机延迟
    for (const char of text) {
      await page.keyboard.press(char, {
        delay: 30 + Math.floor(Math.random() * 70),
      });

      // 偶尔停顿（模拟思考）
      if (Math.random() > 0.9) {
        await this.randomDelay(200, 500);
      }
    }

    // 输入完成后随机延迟
    await this.randomDelay(200, 500);
  }

  /**
   * 生成贝塞尔曲线路径
   */
  private generateBezierPath(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    steps: number
  ): Array<{ x: number; y: number }> {
    const points: Array<{ x: number; y: number }> = [];

    // 控制点（添加随机偏移）
    const cx1 = x1 + (x2 - x1) * 0.3 + (Math.random() - 0.5) * 100;
    const cy1 = y1 + (y2 - y1) * 0.1 + (Math.random() - 0.5) * 100;
    const cx2 = x1 + (x2 - x1) * 0.7 + (Math.random() - 0.5) * 100;
    const cy2 = y1 + (y2 - y1) * 0.9 + (Math.random() - 0.5) * 100;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x =
        Math.pow(1 - t, 3) * x1 +
        3 * Math.pow(1 - t, 2) * t * cx1 +
        3 * (1 - t) * Math.pow(t, 2) * cx2 +
        Math.pow(t, 3) * x2;
      const y =
        Math.pow(1 - t, 3) * y1 +
        3 * Math.pow(1 - t, 2) * t * cy1 +
        3 * (1 - t) * Math.pow(t, 2) * cy2 +
        Math.pow(t, 3) * y2;

      points.push({ x, y });
    }

    return points;
  }

  /**
   * 随机延迟
   */
  private async randomDelay(min: number, max: number): Promise<void> {
    const delay = min + Math.random() * (max - min);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * 模拟页面阅读时间
   */
  async simulateReadingTime(page: any): Promise<void> {
    // 获取页面内容长度
    const contentLength = await page.evaluate(
      () => document.body.innerText.length
    );

    // 根据内容长度计算阅读时间（假设每秒阅读 20 个字符）
    const estimatedReadTime = Math.min(
      Math.max(contentLength / 20, 1000),
      10000
    );

    // 添加随机因子
    const actualReadTime = estimatedReadTime * (0.5 + Math.random());

    await this.randomDelay(actualReadTime * 0.3, actualReadTime * 0.7);
  }
}

// 导出单例实例
export const antiDetectionManager = new AntiDetectionManager();
