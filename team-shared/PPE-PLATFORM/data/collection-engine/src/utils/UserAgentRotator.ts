// 全局PPE数据采集引擎 - User-Agent轮换器

/**
 * User-Agent轮换器类
 */
export class UserAgentRotator {
  private userAgents: string[] = [
    // Chrome on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    
    // Chrome on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
    
    // Firefox on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:119.0) Gecko/20100101 Firefox/119.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:118.0) Gecko/20100101 Firefox/118.0',
    
    // Firefox on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:119.0) Gecko/20100101 Firefox/119.0',
    
    // Safari on macOS
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
    
    // Edge on Windows
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
    
    // Chrome on Linux
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  ];

  private currentIndex: number = 0;

  /**
   * 添加User-Agent
   */
  addUserAgent(userAgent: string): void {
    this.userAgents.push(userAgent);
  }

  /**
   * 批量添加User-Agent
   */
  addUserAgents(userAgents: string[]): void {
    this.userAgents.push(...userAgents);
  }

  /**
   * 获取随机User-Agent
   */
  getRandomUserAgent(): string {
    const randomIndex = Math.floor(Math.random() * this.userAgents.length);
    return this.userAgents[randomIndex];
  }

  /**
   * 轮询获取User-Agent
   */
  getNextUserAgent(): string {
    const userAgent = this.userAgents[this.currentIndex % this.userAgents.length];
    this.currentIndex++;
    return userAgent;
  }

  /**
   * 获取User-Agent数量
   */
  getUserAgentCount(): number {
    return this.userAgents.length;
  }

  /**
   * 从文件加载User-Agent列表
   */
  loadFromFile(filePath: string): void {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf-8');
      const userAgents = content.split('\n').filter((line: string) => line.trim());
      this.addUserAgents(userAgents);
    } catch (error) {
      console.error('Failed to load User-Agent list from file:', error);
    }
  }

  /**
   * 获取特定浏览器的User-Agent
   */
  getUserAgentByBrowser(browser: 'chrome' | 'firefox' | 'safari' | 'edge'): string {
    const filtered = this.userAgents.filter((ua) =>
      ua.toLowerCase().includes(browser.toLowerCase())
    );
    
    if (filtered.length === 0) {
      return this.getRandomUserAgent();
    }
    
    return filtered[Math.floor(Math.random() * filtered.length)];
  }

  /**
   * 获取特定操作系统的User-Agent
   */
  getUserAgentByOS(os: 'windows' | 'macos' | 'linux'): string {
    const osPatterns = {
      windows: /Windows NT/,
      macos: /Macintosh|Mac OS X/,
      linux: /Linux/,
    };

    const filtered = this.userAgents.filter((ua) =>
      osPatterns[os].test(ua)
    );

    if (filtered.length === 0) {
      return this.getRandomUserAgent();
    }

    return filtered[Math.floor(Math.random() * filtered.length)];
  }
}

// 导出单例实例
export const userAgentRotator = new UserAgentRotator();
