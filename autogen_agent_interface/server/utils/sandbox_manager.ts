/**
 * Sandbox Manager
 * Inspirado no AI Manus - Gerenciamento de sandboxes Docker isolados
 * 
 * Este módulo implementa:
 * - Criação de sandboxes Docker isolados
 * - TTL (Time-To-Live) para limpeza automática
 * - Gerenciamento de recursos
 * - Integração com VNC para visualização
 * - Chrome Headless integrado
 */

import Docker from "dockerode";
import { v4 as uuidv4 } from "uuid";

export interface SandboxConfig {
  image?: string;
  namePrefix?: string;
  ttlMinutes?: number;
  network?: string;
  chromeArgs?: string;
  resources?: {
    cpu?: string;
    memory?: string;
  };
  vncEnabled?: boolean;
  cdpPort?: number;
}

export interface Sandbox {
  id: string;
  containerId: string;
  name: string;
  vncPort?: number;
  cdpPort?: number;
  websocketPort?: number;
  createdAt: Date;
  expiresAt: Date;
  status: "creating" | "running" | "stopped" | "expired";
  config: SandboxConfig;
}

export class SandboxManager {
  private docker: Docker;
  private sandboxes: Map<string, Sandbox> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.docker = new Docker();
    this.startCleanupInterval();
  }

  /**
   * Create a new sandbox
   * Creates an isolated Docker container for code execution
   */
  async createSandbox(config: SandboxConfig = {}): Promise<Sandbox> {
    const sandboxId = uuidv4();
    const sandboxName = `${config.namePrefix || "sandbox"}-${sandboxId.substring(0, 8)}`;
    
    const defaultConfig: SandboxConfig = {
      image: config.image || "python:3.11-slim",
      namePrefix: config.namePrefix || "sandbox",
      ttlMinutes: config.ttlMinutes || 30,
      network: config.network || "bridge",
      chromeArgs: config.chromeArgs || "--headless --no-sandbox --disable-gpu",
      vncEnabled: config.vncEnabled ?? true,
      cdpPort: config.cdpPort || 9222,
      resources: config.resources || {},
    };

    const sandbox: Sandbox = {
      id: sandboxId,
      containerId: "",
      name: sandboxName,
      vncPort: defaultConfig.vncEnabled ? await this.getAvailablePort(5900) : undefined,
      cdpPort: defaultConfig.cdpPort,
      websocketPort: defaultConfig.vncEnabled ? await this.getAvailablePort(6080) : undefined,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + (defaultConfig.ttlMinutes! * 60 * 1000)),
      status: "creating",
      config: defaultConfig,
    };

    try {
      // Create container
      const container = await this.docker.createContainer({
        Image: defaultConfig.image,
        name: sandboxName,
        Cmd: ["/bin/sh", "-c", "sleep infinity"], // Keep container alive
        Env: [
          "DISPLAY=:99",
          `VNC_PORT=${sandbox.vncPort || 5900}`,
          `CDP_PORT=${sandbox.cdpPort || 9222}`,
        ],
        HostConfig: {
          NetworkMode: defaultConfig.network,
          AutoRemove: false,
          Resources: {
            Memory: defaultConfig.resources?.memory ? parseInt(defaultConfig.resources.memory) * 1024 * 1024 : undefined,
            CpuQuota: defaultConfig.resources?.cpu ? parseInt(defaultConfig.resources.cpu) * 100000 : undefined,
          },
          PortBindings: sandbox.vncPort ? {
            "5900/tcp": [{ HostPort: sandbox.vncPort.toString() }],
          } : {},
        },
        ExposedPorts: {
          "5900/tcp": {},
          "9222/tcp": {},
        },
      });

      sandbox.containerId = container.id;
      
      // Start container
      await container.start();
      
      // Setup VNC if enabled
      if (defaultConfig.vncEnabled && sandbox.vncPort) {
        await this.setupVNC(container, sandbox);
      }

      // Setup Chrome Headless if needed
      if (defaultConfig.cdpPort) {
        await this.setupChrome(container, sandbox);
      }

      sandbox.status = "running";
      this.sandboxes.set(sandboxId, sandbox);

      console.log(`[SandboxManager] Created sandbox ${sandboxId} (${sandboxName})`);
      return sandbox;
    } catch (error) {
      console.error(`[SandboxManager] Error creating sandbox:`, error);
      sandbox.status = "stopped";
      throw error;
    }
  }

  /**
   * Setup VNC server in container
   * Installs and configures VNC server for remote desktop access
   */
  private async setupVNC(container: Docker.Container, sandbox: Sandbox): Promise<void> {
    try {
      // Install VNC server and dependencies
      const installCommands = [
        "apt-get update",
        "apt-get install -y xvfb x11vnc fluxbox",
        "mkdir -p ~/.vnc",
        "x11vnc -storepasswd manus ~/.vnc/passwd",
      ];

      for (const cmd of installCommands) {
        await this.execInContainer(container, cmd);
      }

      // Start VNC server
      await this.execInContainer(container, "Xvfb :99 -screen 0 1024x768x24 &");
      await this.execInContainer(container, "DISPLAY=:99 fluxbox &");
      await this.execInContainer(container, `x11vnc -display :99 -forever -shared -rfbport 5900 -passwd manus &`);

      console.log(`[SandboxManager] VNC server setup completed for sandbox ${sandbox.id}`);
    } catch (error) {
      console.error(`[SandboxManager] Error setting up VNC:`, error);
    }
  }

  /**
   * Setup Chrome Headless in container
   * Installs and configures Chrome for web automation
   */
  private async setupChrome(container: Docker.Container, sandbox: Sandbox): Promise<void> {
    try {
      // Install Chrome
      const installCommands = [
        "apt-get update",
        "apt-get install -y wget gnupg",
        "wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -",
        "echo 'deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main' > /etc/apt/sources.list.d/google-chrome.list",
        "apt-get update",
        "apt-get install -y google-chrome-stable",
      ];

      for (const cmd of installCommands) {
        await this.execInContainer(container, cmd);
      }

      // Start Chrome with CDP
      const chromeCmd = `google-chrome-stable ${sandbox.config.chromeArgs} --remote-debugging-port=${sandbox.cdpPort} &`;
      await this.execInContainer(container, chromeCmd);

      console.log(`[SandboxManager] Chrome Headless setup completed for sandbox ${sandbox.id}`);
    } catch (error) {
      console.error(`[SandboxManager] Error setting up Chrome:`, error);
    }
  }

  /**
   * Execute command in container
   */
  private async execInContainer(container: Docker.Container, command: string): Promise<string> {
    return new Promise((resolve, reject) => {
      container.exec({
        Cmd: ["/bin/sh", "-c", command],
        AttachStdout: true,
        AttachStderr: true,
      }, (err, exec) => {
        if (err) {
          reject(err);
          return;
        }

        exec!.start({}, (err, stream) => {
          if (err) {
            reject(err);
            return;
          }

          let output = "";
          stream!.on("data", (chunk: Buffer) => {
            output += chunk.toString();
          });

          stream!.on("end", () => {
            resolve(output);
          });
        });
      });
    });
  }

  /**
   * Get sandbox by ID
   */
  getSandbox(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  /**
   * List all sandboxes
   */
  listSandboxes(): Sandbox[] {
    return Array.from(this.sandboxes.values());
  }

  /**
   * Stop sandbox
   */
  async stopSandbox(id: string): Promise<void> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) {
      throw new Error(`Sandbox ${id} not found`);
    }

    try {
      const container = this.docker.getContainer(sandbox.containerId);
      await container.stop();
      await container.remove();
      
      sandbox.status = "stopped";
      this.sandboxes.delete(id);
      
      console.log(`[SandboxManager] Stopped sandbox ${id}`);
    } catch (error) {
      console.error(`[SandboxManager] Error stopping sandbox:`, error);
      throw error;
    }
  }

  /**
   * Execute code in sandbox
   */
  async executeCode(sandboxId: string, code: string, language: string = "python"): Promise<string> {
    const sandbox = this.sandboxes.get(sandboxId);
    if (!sandbox) {
      throw new Error(`Sandbox ${sandboxId} not found`);
    }

    if (sandbox.status !== "running") {
      throw new Error(`Sandbox ${sandboxId} is not running`);
    }

    try {
      const container = this.docker.getContainer(sandbox.containerId);
      
      // Determine command based on language
      let command = "";
      switch (language.toLowerCase()) {
        case "python":
          command = `python3 -c ${JSON.stringify(code)}`;
          break;
        case "javascript":
        case "js":
          command = `node -e ${JSON.stringify(code)}`;
          break;
        case "bash":
        case "shell":
          command = code;
          break;
        default:
          command = code;
      }

      const output = await this.execInContainer(container, command);
      return output;
    } catch (error) {
      console.error(`[SandboxManager] Error executing code:`, error);
      throw error;
    }
  }

  /**
   * Get available port
   */
  private async getAvailablePort(startPort: number): Promise<number> {
    // Simple port selection - in production, use proper port management
    return startPort + Math.floor(Math.random() * 1000);
  }

  /**
   * Start cleanup interval
   * Periodically checks for expired sandboxes and cleans them up
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSandboxes();
    }, 60000); // Check every minute
  }

  /**
   * Cleanup expired sandboxes
   */
  private async cleanupExpiredSandboxes(): Promise<void> {
    const now = new Date();
    const expiredSandboxes: string[] = [];

    for (const [id, sandbox] of this.sandboxes.entries()) {
      if (sandbox.expiresAt < now) {
        expiredSandboxes.push(id);
      }
    }

    for (const id of expiredSandboxes) {
      try {
        await this.stopSandbox(id);
        console.log(`[SandboxManager] Cleaned up expired sandbox ${id}`);
      } catch (error) {
        console.error(`[SandboxManager] Error cleaning up sandbox ${id}:`, error);
      }
    }
  }

  /**
   * Cleanup all sandboxes
   */
  async cleanupAll(): Promise<void> {
    const sandboxIds = Array.from(this.sandboxes.keys());
    for (const id of sandboxIds) {
      try {
        await this.stopSandbox(id);
      } catch (error) {
        console.error(`[SandboxManager] Error cleaning up sandbox ${id}:`, error);
      }
    }
  }

  /**
   * Destroy sandbox manager
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    await this.cleanupAll();
  }
}

// Singleton instance
let sandboxManagerInstance: SandboxManager | null = null;

export function getSandboxManager(): SandboxManager {
  if (!sandboxManagerInstance) {
    sandboxManagerInstance = new SandboxManager();
  }
  return sandboxManagerInstance;
}

