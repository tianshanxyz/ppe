"use strict";
/**
 * 浏览器指纹生成器
 * 用于生成随机的浏览器指纹，避免被反爬虫系统识别
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.fingerprintGenerator = exports.FingerprintGenerator = void 0;
/**
 * 浏览器指纹生成器类
 */
class FingerprintGenerator {
    viewports = [
        { width: 1920, height: 1080, deviceScaleFactor: 1 },
        { width: 1366, height: 768, deviceScaleFactor: 1 },
        { width: 1440, height: 900, deviceScaleFactor: 2 },
        { width: 1536, height: 864, deviceScaleFactor: 1.25 },
        { width: 1280, height: 720, deviceScaleFactor: 1 },
        { width: 1680, height: 1050, deviceScaleFactor: 2 },
        { width: 2560, height: 1440, deviceScaleFactor: 1 },
    ];
    screens = [
        { width: 1920, height: 1080, colorDepth: 24 },
        { width: 2560, height: 1440, colorDepth: 24 },
        { width: 3840, height: 2160, colorDepth: 24 },
        { width: 1366, height: 768, colorDepth: 24 },
        { width: 1440, height: 900, colorDepth: 24 },
    ];
    timezones = [
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Asia/Singapore',
        'Australia/Sydney',
        'Pacific/Auckland',
    ];
    locales = [
        'en-US',
        'en-GB',
        'en-CA',
        'en-AU',
        'fr-FR',
        'de-DE',
        'ja-JP',
        'zh-CN',
        'zh-TW',
        'ko-KR',
        'es-ES',
        'it-IT',
        'pt-BR',
        'ru-RU',
    ];
    platforms = [
        'Win32',
        'MacIntel',
        'Linux x86_64',
        'Linux aarch64',
    ];
    webglVendors = [
        'Intel Inc.',
        'NVIDIA Corporation',
        'AMD',
        'Apple Inc.',
        'Google Inc.',
    ];
    webglRenderers = [
        'Intel Iris OpenGL Engine',
        'NVIDIA GeForce GTX 1060 OpenGL Engine',
        'AMD Radeon Pro 5300M OpenGL Engine',
        'Apple M1',
        'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)',
        'ANGLE (NVIDIA, NVIDIA GeForce GTX 1050 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
    ];
    commonFonts = [
        'Arial',
        'Arial Black',
        'Arial Narrow',
        'Calibri',
        'Cambria',
        'Comic Sans MS',
        'Courier New',
        'Georgia',
        'Helvetica',
        'Impact',
        'Segoe UI',
        'Tahoma',
        'Times New Roman',
        'Trebuchet MS',
        'Verdana',
        'Microsoft Sans Serif',
        'MS Gothic',
        'MS Mincho',
        'SimSun',
        'SimHei',
        'Meiryo',
        'Yu Gothic',
    ];
    plugins = [
        {
            name: 'Chrome PDF Plugin',
            filename: 'internal-pdf-viewer',
            description: 'Portable Document Format',
            version: 'undefined',
        },
        {
            name: 'Chrome PDF Viewer',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            description: 'Portable Document Format',
            version: 'undefined',
        },
        {
            name: 'Native Client',
            filename: 'internal-nacl-plugin',
            description: 'Native Client module',
            version: 'undefined',
        },
    ];
    /**
     * 生成随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    /**
     * 从数组中随机选择一个元素
     */
    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    /**
     * 从数组中随机选择多个元素
     */
    randomChoices(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }
    /**
     * 生成浏览器指纹
     */
    generate() {
        const viewport = this.randomChoice(this.viewports);
        const screen = this.randomChoice(this.screens);
        const locale = this.randomChoice(this.locales);
        const languages = this.generateLanguages(locale);
        return {
            userAgent: this.generateUserAgent(),
            viewport: {
                width: viewport.width,
                height: viewport.height,
                deviceScaleFactor: viewport.deviceScaleFactor,
            },
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
            },
            timezone: this.randomChoice(this.timezones),
            locale,
            languages,
            platform: this.randomChoice(this.platforms),
            hardwareConcurrency: this.randomChoice([2, 4, 6, 8, 12, 16]),
            deviceMemory: this.randomChoice([2, 4, 8, 16]),
            webglVendor: this.randomChoice(this.webglVendors),
            webglRenderer: this.randomChoice(this.webglRenderers),
            canvas: {
                noise: Math.random() * 0.001,
            },
            fonts: this.randomChoices(this.commonFonts, this.randomInt(8, 15)),
            plugins: this.randomChoices(this.plugins, this.randomInt(1, 3)),
            colorGamut: this.randomChoice(['srgb', 'p3', 'rec2020']),
            forcedColors: this.randomChoice(['none', 'active']),
            monochrome: Math.random() > 0.95 ? 1 : 0,
            contrast: this.randomChoice([0, 0.5, 1]),
            reducedMotion: this.randomChoice(['no-preference', 'reduce']),
            hdr: Math.random() > 0.5,
        };
    }
    /**
     * 生成用户代理字符串
     */
    generateUserAgent() {
        const chromeVersions = ['120.0.0.0', '119.0.0.0', '118.0.0.0', '117.0.0.0'];
        const chromeVersion = this.randomChoice(chromeVersions);
        const platforms = [
            `Windows NT 10.0; Win64; x64`,
            `Macintosh; Intel Mac OS X 10_15_7`,
            `X11; Linux x86_64`,
            `Windows NT 10.0; WOW64`,
        ];
        const platform = this.randomChoice(platforms);
        return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion} Safari/537.36`;
    }
    /**
     * 生成语言列表
     */
    generateLanguages(primaryLocale) {
        const languages = [primaryLocale];
        // 添加次要语言
        if (primaryLocale.startsWith('en')) {
            languages.push('en');
        }
        else if (primaryLocale.startsWith('zh')) {
            languages.push('zh', 'en-US', 'en');
        }
        else if (primaryLocale.startsWith('ja')) {
            languages.push('ja', 'en-US', 'en');
        }
        else {
            languages.push('en-US', 'en');
        }
        return [...new Set(languages)];
    }
    /**
     * 应用指纹到 Puppeteer 页面
     */
    async applyToPage(page) {
        const fingerprint = this.generate();
        // 设置 viewport
        await page.setViewport(fingerprint.viewport);
        // 设置 user agent
        await page.setUserAgent(fingerprint.userAgent);
        // 注入指纹脚本
        await page.evaluateOnNewDocument((fp) => {
            // 覆盖 navigator 属性
            Object.defineProperty(navigator, 'platform', {
                get: () => fp.platform,
            });
            Object.defineProperty(navigator, 'hardwareConcurrency', {
                get: () => fp.hardwareConcurrency,
            });
            Object.defineProperty(navigator, 'deviceMemory', {
                get: () => fp.deviceMemory,
            });
            Object.defineProperty(navigator, 'language', {
                get: () => fp.locale,
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => fp.languages,
            });
            // 覆盖 screen 属性
            Object.defineProperty(screen, 'width', {
                get: () => fp.screen.width,
            });
            Object.defineProperty(screen, 'height', {
                get: () => fp.screen.height,
            });
            Object.defineProperty(screen, 'colorDepth', {
                get: () => fp.screen.colorDepth,
            });
            // 覆盖时区
            const originalDateTimeFormat = Intl.DateTimeFormat;
            Intl.DateTimeFormat = function (locale, options) {
                return new originalDateTimeFormat(locale || fp.locale, {
                    ...options,
                    timeZone: options?.timeZone || fp.timezone,
                });
            };
            // 覆盖插件信息
            Object.defineProperty(navigator, 'plugins', {
                get: () => fp.plugins,
            });
            // Canvas 噪声
            const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
            CanvasRenderingContext2D.prototype.getImageData = function (x, y, w, h) {
                const imageData = originalGetImageData.call(this, x, y, w, h);
                const data = imageData.data;
                for (let i = 0; i < data.length; i += 4) {
                    data[i] += Math.random() * fp.canvas.noise - fp.canvas.noise / 2;
                    data[i + 1] += Math.random() * fp.canvas.noise - fp.canvas.noise / 2;
                    data[i + 2] += Math.random() * fp.canvas.noise - fp.canvas.noise / 2;
                }
                return imageData;
            };
        }, fingerprint);
        // 设置时区
        await page.emulateTimezone(fingerprint.timezone);
        // 设置地理位置（随机偏移）
        const baseLocations = {
            'America/New_York': { lat: 40.7128, lng: -74.006 },
            'America/Los_Angeles': { lat: 34.0522, lng: -118.2437 },
            'Europe/London': { lat: 51.5074, lng: -0.1278 },
            'Europe/Paris': { lat: 48.8566, lng: 2.3522 },
            'Asia/Tokyo': { lat: 35.6762, lng: 139.6503 },
            'Asia/Shanghai': { lat: 31.2304, lng: 121.4737 },
            'Australia/Sydney': { lat: -33.8688, lng: 151.2093 },
        };
        const location = baseLocations[fingerprint.timezone];
        if (location) {
            // 添加随机偏移（约10km范围内）
            const latOffset = (Math.random() - 0.5) * 0.18;
            const lngOffset = (Math.random() - 0.5) * 0.18;
            await page.setGeolocation({
                latitude: location.lat + latOffset,
                longitude: location.lng + lngOffset,
            });
        }
    }
    /**
     * 生成 WebDriver 隐藏脚本
     */
    getWebdriverHideScript() {
        return `
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });

      delete navigator.__proto__.webdriver;

      window.chrome = {
        runtime: {},
        loadTimes: function() {},
        csi: function() {},
        app: {},
      };

      Object.defineProperty(navigator, 'plugins', {
        get: function() {
          return [
            {
              0: {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format"},
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 1,
              name: "Chrome PDF Plugin"
            },
            {
              0: {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format"},
              description: "Portable Document Format",
              filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
              length: 1,
              name: "Chrome PDF Viewer"
            }
          ];
        }
      });

      Object.defineProperty(navigator, 'mimeTypes', {
        get: function() {
          return [
            {type: "application/pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: {}},
            {type: "application/x-google-chrome-pdf", suffixes: "pdf", description: "Portable Document Format", enabledPlugin: {}}
          ];
        }
      });

      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    `;
    }
}
exports.FingerprintGenerator = FingerprintGenerator;
// 导出单例实例
exports.fingerprintGenerator = new FingerprintGenerator();
//# sourceMappingURL=FingerprintGenerator.js.map