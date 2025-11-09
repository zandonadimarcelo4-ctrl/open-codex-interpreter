/**
 * Device Manager
 * Handles local/remote execution and communication with user devices
 * Integrado com Super Agent Framework para execução real
 */

import axios, { AxiosInstance } from 'axios';
import * as os from 'os';
import { executeWithSuperAgent } from '../../utils/super_agent_bridge';
import { executeWithAutoGen } from '../../utils/autogen';

export type ExecutionMode = 'local' | 'remote';
export type DeviceType = 'desktop' | 'android' | 'ios' | 'web';

export interface DeviceInfo {
  deviceId: string;
  deviceType: DeviceType;
  deviceName: string;
  osVersion: string;
  gpuInfo?: string;
  vramAvailable?: number;
  cpuCores?: number;
  isOnline: boolean;
  lastSeen: Date;
  capabilities: string[];
}

export interface RemoteDevice {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress: string;
  port: number;
  apiKey: string;
  isConnected: boolean;
  lastHeartbeat: Date;
  vramAvailable: number;
}

export interface ExecutionTask {
  taskId: string;
  mode: ExecutionMode;
  deviceId?: string;
  taskType: string;
  payload: Record<string, any>;
  priority: 'low' | 'normal' | 'high';
  createdAt: Date;
  executedAt?: Date;
  completedAt?: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: Record<string, any>;
  error?: string;
}

class DeviceManager {
  private localDevice: DeviceInfo | null = null;
  private remoteDevices: Map<string, RemoteDevice> = new Map();
  private executionMode: ExecutionMode = 'local';
  private taskQueue: ExecutionTask[] = [];
  private clients: Map<string, AxiosInstance> = new Map();

  constructor() {
    this.initializeLocalDevice();
  }

  /**
   * Initialize local device info
   */
  private initializeLocalDevice(): void {
    const gpuInfo = this.getGPUInfo();

    this.localDevice = {
      deviceId: this.generateDeviceId(),
      deviceType: 'web',
      deviceName: `${os.hostname()}-server`,
      osVersion: os.platform(),
      gpuInfo,
      vramAvailable: this.getAvailableVram(),
      cpuCores: os.cpus().length,
      isOnline: true,
      lastSeen: new Date(),
      capabilities: [
        'code-execution',
        'video-editing',
        'ocr',
        'terminal-execution',
        'data-analysis',
        'tts',
        'stt',
        'multimodal',
      ],
    };
  }

  /**
   * Get GPU info
   */
  private getGPUInfo(): string {
    // Try to detect GPU (RTX 4080 Super)
    try {
      // This would integrate with nvidia-smi or similar
      return 'RTX 4080 Super 16GB';
    } catch {
      return 'Unknown';
    }
  }

  /**
   * Get available VRAM
   */
  private getAvailableVram(): number {
    // Default to 16GB for RTX 4080 Super
    return 16;
  }

  /**
   * Generate unique device ID
   */
  private generateDeviceId(): string {
    return `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Register remote device
   */
  async registerRemoteDevice(
    name: string,
    type: DeviceType,
    ipAddress: string,
    port: number,
    apiKey: string
  ): Promise<RemoteDevice> {
    const deviceId = this.generateDeviceId();
    const device: RemoteDevice = {
      id: deviceId,
      name,
      type,
      ipAddress,
      port,
      apiKey,
      isConnected: false,
      lastHeartbeat: new Date(),
      vramAvailable: 0,
    };

    // Test connection
    try {
      const client = axios.create({
        baseURL: `http://${ipAddress}:${port}`,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: 5000,
      });

      const response = await client.get('/health');
      if (response.status === 200) {
        device.isConnected = true;
        device.vramAvailable = response.data.vramAvailable || 0;
        this.clients.set(deviceId, client);
      }
    } catch (error) {
      console.error(`Failed to connect to device ${name}:`, error);
    }

    this.remoteDevices.set(deviceId, device);
    return device;
  }

  /**
   * Set execution mode
   */
  setExecutionMode(mode: ExecutionMode): void {
    this.executionMode = mode;
  }

  /**
   * Get current execution mode
   */
  getExecutionMode(): ExecutionMode {
    return this.executionMode;
  }

  /**
   * Get available devices
   */
  getAvailableDevices(): DeviceInfo[] {
    const devices: DeviceInfo[] = [];

    if (this.localDevice) {
      devices.push(this.localDevice);
    }

    this.remoteDevices.forEach(device => {
      if (device.isConnected) {
        devices.push({
          deviceId: device.id,
          deviceType: device.type,
          deviceName: device.name,
          osVersion: 'Remote',
          vramAvailable: device.vramAvailable,
          isOnline: true,
          lastSeen: device.lastHeartbeat,
          capabilities: ['remote-execution'],
        });
      }
    });

    return devices;
  }

  /**
   * Get best device for task
   */
  getBestDeviceForTask(taskType: string): DeviceInfo | null {
    const devices = this.getAvailableDevices();

    if (this.executionMode === 'local' && this.localDevice) {
      return this.localDevice;
    }

    // Find device with best VRAM for task
    return devices.reduce((best, current) => {
      if (!best) return current;
      return (current.vramAvailable || 0) > (best.vramAvailable || 0) ? current : best;
    });
  }

  /**
   * Submit task for execution - INTEGRADO COM SUPER AGENT FRAMEWORK
   */
  async submitTask(
    taskType: string,
    payload: Record<string, any>,
    priority: 'low' | 'normal' | 'high' = 'normal',
    deviceId?: string
  ): Promise<ExecutionTask> {
    const task: ExecutionTask = {
      taskId: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      mode: this.executionMode,
      deviceId: deviceId || this.localDevice?.deviceId,
      taskType,
      payload,
      priority,
      createdAt: new Date(),
      status: 'pending',
    };

    this.taskQueue.push(task);

    // Execute immediately if local mode
    if (this.executionMode === 'local') {
      await this.executeLocalTask(task);
    } else if (deviceId) {
      await this.executeRemoteTask(task, deviceId);
    }

    return task;
  }

  /**
   * Execute task locally - INTEGRADO COM SUPER AGENT FRAMEWORK
   */
  private async executeLocalTask(task: ExecutionTask): Promise<void> {
    task.status = 'running';
    task.executedAt = new Date();

    try {
      // Detectar intenção da tarefa
      const intent = {
        type: task.taskType === 'code' ? 'action' : 'conversation',
        actionType: task.taskType,
        confidence: 0.9,
        reason: `Task execution: ${task.taskType}`,
      };

      // Executar usando Super Agent Framework ou AutoGen
      let result: string;
      try {
        result = await executeWithSuperAgent(
          task.payload.prompt || task.payload.message || '',
          intent,
          task.payload.context || {}
        );
      } catch (superAgentError) {
        // Fallback para AutoGen
        console.warn('Super Agent Framework not available, using AutoGen fallback');
        result = await executeWithAutoGen(
          task.payload.prompt || task.payload.message || '',
          intent
        );
      }

      task.status = 'completed';
      task.result = {
        message: 'Task completed successfully',
        result,
        taskType: task.taskType,
      };
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
    }

    task.completedAt = new Date();
  }

  /**
   * Execute task on remote device
   */
  private async executeRemoteTask(task: ExecutionTask, deviceId: string): Promise<void> {
    const device = this.remoteDevices.get(deviceId);
    if (!device || !device.isConnected) {
      task.status = 'failed';
      task.error = 'Device not connected';
      return;
    }

    const client = this.clients.get(deviceId);
    if (!client) {
      task.status = 'failed';
      task.error = 'Client not found';
      return;
    }

    task.status = 'running';
    task.executedAt = new Date();

    try {
      const response = await client.post('/execute', {
        taskType: task.taskType,
        payload: task.payload,
      });

      task.status = 'completed';
      task.result = response.data;
    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;
    }

    task.completedAt = new Date();
  }

  /**
   * Get task status
   */
  getTaskStatus(taskId: string): ExecutionTask | null {
    return this.taskQueue.find(t => t.taskId === taskId) || null;
  }

  /**
   * Get task queue
   */
  getTaskQueue(limit: number = 50): ExecutionTask[] {
    return this.taskQueue.slice(-limit);
  }

  /**
   * Heartbeat from remote device
   */
  async heartbeat(deviceId: string): Promise<boolean> {
    const device = this.remoteDevices.get(deviceId);
    if (!device) {
      return false;
    }

    device.lastHeartbeat = new Date();
    device.isConnected = true;
    return true;
  }

  /**
   * Disconnect device
   */
  disconnectDevice(deviceId: string): boolean {
    const device = this.remoteDevices.get(deviceId);
    if (!device) {
      return false;
    }

    device.isConnected = false;
    this.clients.delete(deviceId);
    return true;
  }

  /**
   * Get local device info
   */
  getLocalDeviceInfo(): DeviceInfo | null {
    return this.localDevice;
  }

  /**
   * Get remote devices
   */
  getRemoteDevices(): RemoteDevice[] {
    return Array.from(this.remoteDevices.values());
  }
}

// Export singleton instance
export const deviceManager = new DeviceManager();

export default DeviceManager;

