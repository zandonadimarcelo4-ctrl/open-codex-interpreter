/**
 * Browser-Use Integration
 * Inspirado no browser-use - Automação de navegador com IA
 * 
 * Este módulo implementa:
 * - Integração com Playwright para controle de navegador
 * - Agente de IA para automação de navegador
 * - Sistema de ferramentas customizadas
 * - Navegação autônoma
 * - Preenchimento de formulários
 */

import { chromium, Browser, Page, BrowserContext } from "playwright";
import { nanoid } from "nanoid";

export interface BrowserConfig {
  headless?: boolean;
  stealth?: boolean;
  profile?: string;
  proxy?: string;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
}

export interface BrowserAction {
  type: "navigate" | "click" | "fill" | "screenshot" | "extract" | "wait" | "scroll";
  selector?: string;
  url?: string;
  text?: string;
  fields?: Record<string, string>;
  timeout?: number;
}

export interface BrowserResult {
  success: boolean;
  data?: any;
  error?: string;
  screenshot?: string;
}

export interface Tool {
  name: string;
  description: string;
  execute: (args: any) => Promise<any>;
}

export class BrowserUse {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private config: BrowserConfig;
  private tools: Map<string, Tool> = new Map();

  constructor(config: BrowserConfig = {}) {
    this.config = {
      headless: config.headless ?? true,
      stealth: config.stealth ?? true,
      viewport: config.viewport || { width: 1920, height: 1080 },
      ...config,
    };
  }

  /**
   * Initialize browser
   */
  async init(): Promise<void> {
    try {
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: this.config.stealth ? [
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ] : [],
      });

      this.context = await this.browser.newContext({
        viewport: this.config.viewport,
        userAgent: this.config.userAgent || this.getRandomUserAgent(),
      });

      // Stealth mode: Remove webdriver property
      if (this.config.stealth) {
        await this.context.addInitScript(() => {
          Object.defineProperty(navigator, "webdriver", {
            get: () => undefined,
          });
        });
      }

      this.page = await this.context.newPage();
      
      console.log("[BrowserUse] Browser initialized");
    } catch (error) {
      console.error("[BrowserUse] Error initializing browser:", error);
      throw error;
    }
  }

  /**
   * Navigate to URL
   */
  async navigate(url: string): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      await this.page.goto(url, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      return {
        success: true,
        data: {
          url: this.page.url(),
          title: await this.page.title(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Click element
   */
  async click(selector: string): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      await this.page.click(selector, {
        timeout: 10000,
      });

      // Wait for navigation if needed
      await this.page.waitForLoadState("networkidle");

      return {
        success: true,
        data: {
          url: this.page.url(),
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Fill form
   */
  async fillForm(fields: Record<string, string>): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      for (const [selector, value] of Object.entries(fields)) {
        await this.page.fill(selector, value);
        // Small delay between fields
        await this.page.waitForTimeout(100);
      }

      return {
        success: true,
        data: {
          filled: Object.keys(fields).length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Take screenshot
   */
  async screenshot(): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      const screenshot = await this.page.screenshot({
        fullPage: true,
        type: "png",
      });

      return {
        success: true,
        data: {
          screenshot: screenshot.toString("base64"),
        },
        screenshot: screenshot.toString("base64"),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract text from page
   */
  async extractText(): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      const text = await this.page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll("script, style");
        scripts.forEach((el) => el.remove());

        // Get text content
        return document.body.innerText;
      });

      return {
        success: true,
        data: {
          text,
          length: text.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Extract links from page
   */
  async extractLinks(): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      const links = await this.page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll("a"));
        return anchors.map((a) => ({
          text: a.innerText.trim(),
          href: a.href,
        }));
      });

      return {
        success: true,
        data: {
          links,
          count: links.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Wait for element
   */
  async waitForSelector(selector: string, timeout: number = 10000): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      await this.page.waitForSelector(selector, {
        timeout,
      });

      return {
        success: true,
        data: {
          selector,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Scroll page
   */
  async scroll(direction: "up" | "down" | "to-bottom" | "to-top" = "down"): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      if (direction === "to-bottom") {
        await this.page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
      } else if (direction === "to-top") {
        await this.page.evaluate(() => {
          window.scrollTo(0, 0);
        });
      } else if (direction === "down") {
        await this.page.evaluate(() => {
          window.scrollBy(0, window.innerHeight);
        });
      } else if (direction === "up") {
        await this.page.evaluate(() => {
          window.scrollBy(0, -window.innerHeight);
        });
      }

      // Wait for scroll to complete
      await this.page.waitForTimeout(500);

      return {
        success: true,
        data: {
          direction,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute JavaScript in page
   */
  async evaluate(script: string): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      const result = await this.page.evaluate(script);

      return {
        success: true,
        data: {
          result,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get page content (HTML)
   */
  async getContent(): Promise<BrowserResult> {
    if (!this.page) {
      throw new Error("Browser not initialized");
    }

    try {
      const content = await this.page.content();

      return {
        success: true,
        data: {
          content,
          length: content.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Register custom tool
   */
  registerTool(tool: Tool): void {
    this.tools.set(tool.name, tool);
    console.log(`[BrowserUse] Registered tool: ${tool.name}`);
  }

  /**
   * Execute custom tool
   */
  async executeTool(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }

    return await tool.execute(args);
  }

  /**
   * Get available tools
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute action
   */
  async executeAction(action: BrowserAction): Promise<BrowserResult> {
    switch (action.type) {
      case "navigate":
        if (!action.url) {
          return { success: false, error: "URL required for navigate action" };
        }
        return await this.navigate(action.url);

      case "click":
        if (!action.selector) {
          return { success: false, error: "Selector required for click action" };
        }
        return await this.click(action.selector);

      case "fill":
        if (!action.fields) {
          return { success: false, error: "Fields required for fill action" };
        }
        return await this.fillForm(action.fields);

      case "screenshot":
        return await this.screenshot();

      case "extract":
        return await this.extractText();

      case "wait":
        if (!action.selector) {
          return { success: false, error: "Selector required for wait action" };
        }
        return await this.waitForSelector(action.selector, action.timeout);

      case "scroll":
        return await this.scroll(action.text as "up" | "down" | "to-bottom" | "to-top");

      default:
        return { success: false, error: `Unknown action type: ${action.type}` };
    }
  }

  /**
   * Get random user agent
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  /**
   * Close browser
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
    }
    if (this.context) {
      await this.context.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
    console.log("[BrowserUse] Browser closed");
  }

  /**
   * Get current page
   */
  getPage(): Page | null {
    return this.page;
  }

  /**
   * Get current URL
   */
  async getCurrentUrl(): Promise<string | null> {
    if (!this.page) {
      return null;
    }
    return this.page.url();
  }

  /**
   * Get page title
   */
  async getTitle(): Promise<string | null> {
    if (!this.page) {
      return null;
    }
    return await this.page.title();
  }
}

/**
 * Browser Agent
 * Agente de IA para automação de navegador
 */
export class BrowserAgent {
  private browser: BrowserUse;
  private llm: any; // LLM interface
  private tools: Map<string, Tool> = new Map();
  private history: Array<{ role: string; content: string }> = [];

  constructor(config: {
    browser: BrowserUse;
    llm?: any;
    tools?: Tool[];
  }) {
    this.browser = config.browser;
    this.llm = config.llm;

    if (config.tools) {
      config.tools.forEach((tool) => {
        this.tools.set(tool.name, tool);
        this.browser.registerTool(tool);
      });
    }
  }

  /**
   * Run task
   */
  async run(task: string): Promise<Array<{ role: string; content: string }>> {
    this.history.push({ role: "user", content: task });

    // Get page context
    const context = await this.getPageContext();

    // Generate action plan using LLM
    const actionPlan = await this.generateActionPlan(task, context);

    // Execute actions
    for (const action of actionPlan) {
      const result = await this.browser.executeAction(action);
      this.history.push({
        role: "assistant",
        content: `Action: ${action.type}, Result: ${JSON.stringify(result)}`,
      });

      // If action failed, stop execution
      if (!result.success) {
        break;
      }
    }

    return this.history;
  }

  /**
   * Get page context
   */
  private async getPageContext(): Promise<string> {
    const textResult = await this.browser.extractText();
    const linksResult = await this.browser.extractLinks();
    const url = await this.browser.getCurrentUrl();
    const title = await this.browser.getTitle();

    return `
URL: ${url}
Title: ${title}
Text: ${textResult.data?.text?.substring(0, 1000)}
Links: ${JSON.stringify(linksResult.data?.links?.slice(0, 10))}
    `.trim();
  }

  /**
   * Generate action plan
   */
  private async generateActionPlan(task: string, context: string): Promise<BrowserAction[]> {
    // Simple heuristic-based action planning
    // In production, use LLM to generate action plan

    const actions: BrowserAction[] = [];

    // Check if task requires navigation
    if (task.toLowerCase().includes("go to") || task.toLowerCase().includes("navigate")) {
      const urlMatch = task.match(/https?:\/\/[^\s]+/);
      if (urlMatch) {
        actions.push({
          type: "navigate",
          url: urlMatch[0],
        });
      }
    }

    // Check if task requires clicking
    if (task.toLowerCase().includes("click")) {
      // Extract selector from task (simplified)
      const selectorMatch = task.match(/click\s+["']([^"']+)["']/);
      if (selectorMatch) {
        actions.push({
          type: "click",
          selector: selectorMatch[1],
        });
      }
    }

    // Check if task requires form filling
    if (task.toLowerCase().includes("fill") || task.toLowerCase().includes("form")) {
      // Extract fields from task (simplified)
      const fields: Record<string, string> = {};
      // In production, use LLM to extract fields
      actions.push({
        type: "fill",
        fields,
      });
    }

    // Default: extract text
    if (actions.length === 0) {
      actions.push({
        type: "extract",
      });
    }

    return actions;
  }

  /**
   * Get history
   */
  getHistory(): Array<{ role: string; content: string }> {
    return this.history;
  }
}

/**
 * Tools system
 */
export class Tools {
  private tools: Map<string, Tool> = new Map();

  /**
   * Register tool
   */
  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Execute tool
   */
  async execute(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool ${name} not found`);
    }
    return await tool.execute(args);
  }

  /**
   * Get all tools
   */
  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool schema for LLM
   */
  getSchema(): Array<{ name: string; description: string; parameters: any }> {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: {}, // In production, extract from tool function signature
    }));
  }
}

/**
 * Tool decorator
 */
export function tool(name: string, description: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      return await originalMethod.apply(this, args);
    };
    // Register tool
    // In production, register with tools system
    return descriptor;
  };
}

