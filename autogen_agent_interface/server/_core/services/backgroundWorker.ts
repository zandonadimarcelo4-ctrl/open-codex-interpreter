/**
 * Background Worker
 * Enables 24/7 operation - "He works while you sleep"
 * Integrado com Super Agent Framework para execução real de tarefas
 */

import { EventEmitter } from 'events';
import { executeWithSuperAgent } from '../../utils/super_agent_bridge';
import { executeWithAutoGen } from '../../utils/autogen';

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  taskType: string;
  payload: Record<string, any>;
  schedule: ScheduleConfig;
  isActive: boolean;
  createdAt: Date;
  lastRun?: Date;
  nextRun?: Date;
  executionCount: number;
  failureCount: number;
}

export interface ScheduleConfig {
  type: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6
  dayOfMonth?: number; // 1-31
  cronExpression?: string;
  timezone?: string;
}

export interface BackgroundJob {
  jobId: string;
  taskId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  result?: Record<string, any>;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

class BackgroundWorker extends EventEmitter {
  private scheduledTasks: Map<string, ScheduledTask> = new Map();
  private backgroundJobs: Map<string, BackgroundJob> = new Map();
  private isRunning: boolean = false;
  private workerInterval: ReturnType<typeof setInterval> | null = null;
  private checkInterval: number = 60000; // Check every minute
  private maxConcurrentJobs: number = 3;
  private activeJobs: Set<string> = new Set();

  constructor() {
    super();
  }

  /**
   * Start background worker
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Background worker already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Background worker started - "He works while you sleep"');

    this.workerInterval = setInterval(() => {
      this.checkScheduledTasks();
      this.processBackgroundJobs();
    }, this.checkInterval) as ReturnType<typeof setInterval>;

    this.emit('started');
  }

  /**
   * Stop background worker
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Background worker not running');
      return;
    }

    this.isRunning = false;
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = null;
    }

    console.log('Background worker stopped');
    this.emit('stopped');
  }

  /**
   * Check if worker is running
   */
  isWorkerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Create scheduled task
   */
  createScheduledTask(
    name: string,
    description: string,
    taskType: string,
    payload: Record<string, any>,
    schedule: ScheduleConfig
  ): ScheduledTask {
    const task: ScheduledTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      taskType,
      payload,
      schedule,
      isActive: true,
      createdAt: new Date(),
      executionCount: 0,
      failureCount: 0,
    };

    this.scheduledTasks.set(task.id, task);
    this.calculateNextRun(task);
    this.emit('task-created', task);

    return task;
  }

  /**
   * Calculate next run time
   */
  private calculateNextRun(task: ScheduledTask): void {
    const now = new Date();

    switch (task.schedule.type) {
      case 'once':
        if (task.schedule.time) {
          const [hours, minutes] = task.schedule.time.split(':').map(Number);
          const nextRun = new Date(now);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
          task.nextRun = nextRun;
        }
        break;

      case 'daily':
        if (task.schedule.time) {
          const [hours, minutes] = task.schedule.time.split(':').map(Number);
          const nextRun = new Date(now);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setDate(nextRun.getDate() + 1);
          }
          task.nextRun = nextRun;
        }
        break;

      case 'hourly':
        task.nextRun = new Date(now.getTime() + 60 * 60 * 1000);
        break;

      case 'weekly':
        if (task.schedule.dayOfWeek !== undefined && task.schedule.time) {
          const [hours, minutes] = task.schedule.time.split(':').map(Number);
          const nextRun = new Date(now);
          const daysUntil = (task.schedule.dayOfWeek - nextRun.getDay() + 7) % 7 || 7;
          nextRun.setDate(nextRun.getDate() + daysUntil);
          nextRun.setHours(hours, minutes, 0, 0);
          task.nextRun = nextRun;
        }
        break;

      case 'monthly':
        if (task.schedule.dayOfMonth && task.schedule.time) {
          const [hours, minutes] = task.schedule.time.split(':').map(Number);
          const nextRun = new Date(now);
          nextRun.setDate(task.schedule.dayOfMonth);
          nextRun.setHours(hours, minutes, 0, 0);
          if (nextRun <= now) {
            nextRun.setMonth(nextRun.getMonth() + 1);
          }
          task.nextRun = nextRun;
        }
        break;
    }
  }

  /**
   * Check scheduled tasks
   */
  private async checkScheduledTasks(): Promise<void> {
    const now = new Date();

    this.scheduledTasks.forEach((task, taskId) => {
      if (!task.isActive || !task.nextRun) {
        return;
      }

      if (task.nextRun <= now) {
        // Submit job
        const job = this.submitBackgroundJob(task);
        this.emit('task-triggered', task);

        // Calculate next run
        this.calculateNextRun(task);
      }
    });
  }

  /**
   * Submit background job
   */
  private submitBackgroundJob(task: ScheduledTask): BackgroundJob {
    const job: BackgroundJob = {
      jobId: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      taskId: task.id,
      status: 'pending',
      startTime: new Date(),
      retryCount: 0,
      maxRetries: 3,
    };

    this.backgroundJobs.set(job.jobId, job);
    this.emit('job-submitted', job);

    return job;
  }

  /**
   * Process background jobs
   */
  private async processBackgroundJobs(): Promise<void> {
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      return;
    }

    this.backgroundJobs.forEach((job, jobId) => {
      if (job.status === 'pending' && this.activeJobs.size < this.maxConcurrentJobs) {
        this.activeJobs.add(jobId);
        this.executeBackgroundJob(job).catch(err => console.error('Job execution error:', err));
        this.activeJobs.delete(jobId);
      }
    });
  }

  /**
   * Execute background job - INTEGRADO COM SUPER AGENT FRAMEWORK
   */
  private async executeBackgroundJob(job: BackgroundJob): Promise<void> {
    job.status = 'running';
    this.emit('job-started', job);

    try {
      const task = this.scheduledTasks.get(job.taskId);
      if (!task) {
        throw new Error('Task not found');
      }

      // Detectar intenção da tarefa
      const intent = {
        type: task.taskType === 'code' ? 'action' : 'conversation',
        actionType: task.taskType,
        confidence: 0.9,
        reason: `Scheduled task: ${task.name}`,
      };

      // Executar usando Super Agent Framework ou AutoGen
      let result: string;
      try {
        result = await executeWithSuperAgent(
          task.payload.prompt || task.description,
          intent,
          task.payload.context || {}
        );
      } catch (superAgentError) {
        // Fallback para AutoGen
        console.warn('Super Agent Framework not available, using AutoGen fallback');
        result = await executeWithAutoGen(
          task.payload.prompt || task.description,
          intent
        );
      }

      job.status = 'completed';
      job.result = {
        message: 'Job completed successfully',
        result,
        taskType: task.taskType,
      };
      job.endTime = new Date();

      task.executionCount++;
      task.lastRun = new Date();

      this.emit('job-completed', job);
    } catch (error: any) {
      job.retryCount++;

      if (job.retryCount < job.maxRetries) {
        job.status = 'pending';
        this.emit('job-retry', job);
      } else {
        job.status = 'failed';
        job.error = error.message;
        job.endTime = new Date();

        const task = this.scheduledTasks.get(job.taskId);
        if (task) {
          task.failureCount++;
        }

        this.emit('job-failed', job);
      }
    }
  }

  /**
   * Get scheduled tasks
   */
  getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values());
  }

  /**
   * Get scheduled task
   */
  getScheduledTask(taskId: string): ScheduledTask | null {
    return this.scheduledTasks.get(taskId) || null;
  }

  /**
   * Update scheduled task
   */
  updateScheduledTask(taskId: string, updates: Partial<ScheduledTask>): boolean {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      return false;
    }

    Object.assign(task, updates);
    this.calculateNextRun(task);
    this.emit('task-updated', task);

    return true;
  }

  /**
   * Delete scheduled task
   */
  deleteScheduledTask(taskId: string): boolean {
    return this.scheduledTasks.delete(taskId);
  }

  /**
   * Get background jobs
   */
  getBackgroundJobs(limit: number = 50): BackgroundJob[] {
    const jobs: BackgroundJob[] = [];
    this.backgroundJobs.forEach(job => jobs.push(job));
    return jobs.slice(-limit);
  }

  /**
   * Get background job
   */
  getBackgroundJob(jobId: string): BackgroundJob | null {
    return this.backgroundJobs.get(jobId) || null;
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    isRunning: boolean;
    totalScheduledTasks: number;
    activeTasks: number;
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    activeJobs: number;
  } {
    const jobs = Array.from(this.backgroundJobs.values());
    return {
      isRunning: this.isRunning,
      totalScheduledTasks: this.scheduledTasks.size,
      activeTasks: Array.from(this.scheduledTasks.values()).filter(t => t.isActive).length,
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      activeJobs: this.activeJobs.size,
    };
  }
}

// Export singleton instance
export const backgroundWorker = new BackgroundWorker();

export default BackgroundWorker;

