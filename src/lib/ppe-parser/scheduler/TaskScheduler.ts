/**
 * 任务调度系统
 * Phase 2: 智能解析模型开发
 *
 * 负责任务的调度、执行、监控和管理
 */

import { EventEmitter } from 'events';
import { PPEParser, DataSourceType, PPEProduct } from '../types';
import { ParserFactory } from '../core/ParserFactory';

/**
 * 任务状态
 */
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * 任务类型
 */
export enum TaskType {
  FULL_SYNC = 'full_sync',
  INCREMENTAL_SYNC = 'incremental_sync',
  SINGLE_PRODUCT = 'single_product',
  LIST_FETCH = 'list_fetch',
  DETAIL_FETCH = 'detail_fetch',
  VALIDATION = 'validation',
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  CRITICAL = 0,
  HIGH = 1,
  NORMAL = 2,
  LOW = 3,
}

/**
 * 任务配置
 */
export interface TaskConfig {
  /** 任务类型 */
  type: TaskType;
  /** 数据源类型 */
  sourceType: DataSourceType;
  /** 任务优先级 */
  priority: TaskPriority;
  /** 最大重试次数 */
  maxRetries: number;
  /** 超时时间（毫秒） */
  timeout: number;
  /** 并发数 */
  concurrency: number;
  /** 是否启用 */
  enabled: boolean;
  /** 自定义参数 */
  params?: Record<string, any>;
}

/**
 * 任务定义
 */
export interface Task {
  /** 任务 ID */
  id: string;
  /** 任务名称 */
  name: string;
  /** 任务配置 */
  config: TaskConfig;
  /** 任务状态 */
  status: TaskStatus;
  /** 创建时间 */
  createdAt: string;
  /** 开始时间 */
  startedAt?: string;
  /** 完成时间 */
  completedAt?: string;
  /** 进度（0-100） */
  progress: number;
  /** 已处理数量 */
  processedCount: number;
  /** 总数量 */
  totalCount: number;
  /** 成功数量 */
  successCount: number;
  /** 失败数量 */
  failedCount: number;
  /** 错误信息 */
  errors: TaskError[];
  /** 执行结果 */
  result?: TaskResult;
}

/**
 * 任务错误
 */
export interface TaskError {
  timestamp: string;
  message: string;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * 任务结果
 */
export interface TaskResult {
  products: PPEProduct[];
  totalFetched: number;
  totalSaved: number;
  duration: number;
  metadata?: Record<string, any>;
}

/**
 * 调度器配置
 */
export interface SchedulerConfig {
  /** 最大并发任务数 */
  maxConcurrentTasks: number;
  /** 任务队列最大长度 */
  maxQueueSize: number;
  /** 默认任务超时（毫秒） */
  defaultTimeout: number;
  /** 是否启用自动重试 */
  enableAutoRetry: boolean;
  /** 自动重试间隔（毫秒） */
  retryInterval: number;
  /** 是否持久化任务状态 */
  enablePersistence: boolean;
  /** 持久化间隔（毫秒） */
  persistenceInterval: number;
}

/**
 * 任务统计
 */
export interface TaskStatistics {
  totalTasks: number;
  pendingTasks: number;
  runningTasks: number;
  completedTasks: number;
  failedTasks: number;
  totalProducts: number;
  averageDuration: number;
  successRate: number;
}

/**
 * 任务调度器
 * 负责任务的生命周期管理
 */
export class TaskScheduler extends EventEmitter {
  readonly name = 'TaskScheduler';

  private config: SchedulerConfig;
  private tasks: Map<string, Task> = new Map();
  private queue: string[] = [];
  private running: Set<string> = new Set();
  private parsers: Map<DataSourceType, PPEParser> = new Map();
  private isRunning: boolean = false;
  private persistenceTimer?: NodeJS.Timeout;

  constructor(config?: Partial<SchedulerConfig>) {
    super();

    this.config = {
      maxConcurrentTasks: 3,
      maxQueueSize: 100,
      defaultTimeout: 3600000, // 1 hour
      enableAutoRetry: true,
      retryInterval: 60000, // 1 minute
      enablePersistence: false,
      persistenceInterval: 60000, // 1 minute
      ...config,
    };

    this.setupEventHandlers();
  }

  /**
   * 初始化调度器
   */
  async initialize(): Promise<void> {
    // 注册所有解析器
    ParserFactory.registerAll();

    // 启动持久化定时器
    if (this.config.enablePersistence) {
      this.startPersistence();
    }

    console.log(`[${this.name}] Scheduler initialized`);
    this.emit('initialized');
  }

  /**
   * 创建任务
   */
  createTask(
    name: string,
    type: TaskType,
    sourceType: DataSourceType,
    options?: Partial<Omit<TaskConfig, 'type' | 'sourceType'>>
  ): Task {
    const id = this.generateTaskId();

    const task: Task = {
      id,
      name,
      config: {
        type,
        sourceType,
        priority: options?.priority ?? TaskPriority.NORMAL,
        maxRetries: options?.maxRetries ?? 3,
        timeout: options?.timeout ?? this.config.defaultTimeout,
        concurrency: options?.concurrency ?? 1,
        enabled: options?.enabled ?? true,
        params: options?.params,
      },
      status: TaskStatus.PENDING,
      createdAt: new Date().toISOString(),
      progress: 0,
      processedCount: 0,
      totalCount: 0,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    this.tasks.set(id, task);
    this.enqueueTask(id);

    console.log(`[${this.name}] Task created: ${id} - ${name}`);
    this.emit('taskCreated', task);

    return task;
  }

  /**
   * 启动调度器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.warn(`[${this.name}] Scheduler is already running`);
      return;
    }

    this.isRunning = true;
    console.log(`[${this.name}] Scheduler started`);
    this.emit('started');

    // 启动任务处理循环
    this.processQueue();
  }

  /**
   * 停止调度器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // 取消所有运行中的任务
    for (const taskId of this.running) {
      await this.cancelTask(taskId);
    }

    // 停止持久化
    if (this.persistenceTimer) {
      clearInterval(this.persistenceTimer);
    }

    console.log(`[${this.name}] Scheduler stopped`);
    this.emit('stopped');
  }

  /**
   * 暂停任务
   */
  pauseTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);

    if (!task) {
      console.warn(`[${this.name}] Task not found: ${taskId}`);
      return false;
    }

    if (task.status !== TaskStatus.RUNNING) {
      console.warn(`[${this.name}] Cannot pause task ${taskId}, status: ${task.status}`);
      return false;
    }

    task.status = TaskStatus.PAUSED;
    this.emit('taskPaused', task);

    return true;
  }

  /**
   * 恢复任务
   */
  resumeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);

    if (!task) {
      console.warn(`[${this.name}] Task not found: ${taskId}`);
      return false;
    }

    if (task.status !== TaskStatus.PAUSED) {
      console.warn(`[${this.name}] Cannot resume task ${taskId}, status: ${task.status}`);
      return false;
    }

    task.status = TaskStatus.PENDING;
    this.enqueueTask(taskId);
    this.emit('taskResumed', task);

    return true;
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);

    if (!task) {
      console.warn(`[${this.name}] Task not found: ${taskId}`);
      return false;
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      return false;
    }

    task.status = TaskStatus.CANCELLED;
    task.completedAt = new Date().toISOString();

    // 从队列中移除
    const queueIndex = this.queue.indexOf(taskId);
    if (queueIndex > -1) {
      this.queue.splice(queueIndex, 1);
    }

    // 从运行中移除
    this.running.delete(taskId);

    console.log(`[${this.name}] Task cancelled: ${taskId}`);
    this.emit('taskCancelled', task);

    return true;
  }

  /**
   * 重试失败的任务
   */
  async retryTask(taskId: string): Promise<boolean> {
    const task = this.tasks.get(taskId);

    if (!task) {
      console.warn(`[${this.name}] Task not found: ${taskId}`);
      return false;
    }

    if (task.status !== TaskStatus.FAILED) {
      console.warn(`[${this.name}] Cannot retry task ${taskId}, status: ${task.status}`);
      return false;
    }

    // 重置任务状态
    task.status = TaskStatus.PENDING;
    task.progress = 0;
    task.processedCount = 0;
    task.successCount = 0;
    task.failedCount = 0;
    task.errors = [];
    task.result = undefined;
    task.startedAt = undefined;
    task.completedAt = undefined;

    this.enqueueTask(taskId);
    this.emit('taskRetry', task);

    return true;
  }

  /**
   * 获取任务
   */
  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取所有任务
   */
  getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 获取任务统计
   */
  getStatistics(): TaskStatistics {
    const tasks = this.getAllTasks();

    const completedTasks = tasks.filter((t) => t.status === TaskStatus.COMPLETED);
    const totalDuration = completedTasks.reduce((sum, t) => {
      if (t.startedAt && t.completedAt) {
        return sum + (new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime());
      }
      return sum;
    }, 0);

    const totalProducts = tasks.reduce((sum, t) => sum + (t.result?.totalSaved || 0), 0);

    return {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter((t) => t.status === TaskStatus.PENDING).length,
      runningTasks: tasks.filter((t) => t.status === TaskStatus.RUNNING).length,
      completedTasks: completedTasks.length,
      failedTasks: tasks.filter((t) => t.status === TaskStatus.FAILED).length,
      totalProducts,
      averageDuration: completedTasks.length > 0 ? totalDuration / completedTasks.length : 0,
      successRate:
        completedTasks.length > 0
          ? (completedTasks.filter((t) => t.failedCount === 0).length / completedTasks.length) * 100
          : 0,
    };
  }

  /**
   * 处理任务队列
   */
  private async processQueue(): Promise<void> {
    while (this.isRunning) {
      // 检查并发限制
      if (this.running.size >= this.config.maxConcurrentTasks) {
        await this.delay(1000);
        continue;
      }

      // 获取下一个任务
      const taskId = this.getNextTask();

      if (!taskId) {
        await this.delay(1000);
        continue;
      }

      // 执行任务
      this.executeTask(taskId);
    }
  }

  /**
   * 获取下一个任务
   */
  private getNextTask(): string | undefined {
    // 按优先级排序
    const sortedQueue = this.queue
      .map((id) => this.tasks.get(id))
      .filter((task): task is Task => task !== undefined && task.status === TaskStatus.PENDING)
      .sort((a, b) => a.config.priority - b.config.priority);

    return sortedQueue[0]?.id;
  }

  /**
   * 将任务加入队列
   */
  private enqueueTask(taskId: string): void {
    if (!this.queue.includes(taskId)) {
      this.queue.push(taskId);
    }
  }

  /**
   * 执行任务
   */
  private async executeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);

    if (!task || task.status !== TaskStatus.PENDING) {
      return;
    }

    // 更新状态
    task.status = TaskStatus.RUNNING;
    task.startedAt = new Date().toISOString();
    this.running.add(taskId);

    console.log(`[${this.name}] Executing task: ${taskId}`);
    this.emit('taskStarted', task);

    try {
      // 获取或创建解析器
      let parser = this.parsers.get(task.config.sourceType);

      if (!parser) {
        parser = await ParserFactory.createParser(task.config.sourceType);
        this.parsers.set(task.config.sourceType, parser);
      }

      // 执行具体任务
      const result = await this.runTaskWithTimeout(task, parser);

      // 更新任务状态
      task.status = TaskStatus.COMPLETED;
      task.completedAt = new Date().toISOString();
      task.result = result;
      task.progress = 100;

      console.log(`[${this.name}] Task completed: ${taskId}`);
      this.emit('taskCompleted', task);
    } catch (error) {
      // 记录错误
      task.errors.push({
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      // 检查是否需要重试
      if (task.failedCount < task.config.maxRetries && this.config.enableAutoRetry) {
        task.failedCount++;
        task.status = TaskStatus.PENDING;
        console.log(`[${this.name}] Task failed, retrying (${task.failedCount}/${task.config.maxRetries}): ${taskId}`);
        this.emit('taskRetryScheduled', task);
        await this.delay(this.config.retryInterval);
        this.enqueueTask(taskId);
      } else {
        task.status = TaskStatus.FAILED;
        task.completedAt = new Date().toISOString();
        console.error(`[${this.name}] Task failed: ${taskId}`, error);
        this.emit('taskFailed', task, error);
      }
    } finally {
      this.running.delete(taskId);
    }
  }

  /**
   * 带超时的任务执行
   */
  private async runTaskWithTimeout(task: Task, parser: PPEParser): Promise<TaskResult> {
    const startTime = Date.now();
    const products: PPEProduct[] = [];

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Task timeout after ${task.config.timeout}ms`));
      }, task.config.timeout);

      this.runTaskLogic(task, parser, products)
        .then((result) => {
          clearTimeout(timeoutId);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          reject(error);
        });
    });
  }

  /**
   * 执行任务逻辑
   */
  private async runTaskLogic(
    task: Task,
    parser: PPEParser,
    products: PPEProduct[]
  ): Promise<TaskResult> {
    const startTime = Date.now();

    switch (task.config.type) {
      case TaskType.FULL_SYNC:
        return this.runFullSync(task, parser, products);

      case TaskType.INCREMENTAL_SYNC:
        return this.runIncrementalSync(task, parser, products);

      case TaskType.LIST_FETCH:
        return this.runListFetch(task, parser, products);

      case TaskType.DETAIL_FETCH:
        return this.runDetailFetch(task, parser, products);

      default:
        throw new Error(`Unsupported task type: ${task.config.type}`);
    }
  }

  /**
   * 执行全量同步
   */
  private async runFullSync(
    task: Task,
    parser: PPEParser,
    products: PPEProduct[]
  ): Promise<TaskResult> {
    let page = 1;
    let hasMore = true;
    const syncStartTime = Date.now();

    while (hasMore && task.status === TaskStatus.RUNNING) {
      const result = await parser.fetchListPage(page, task.config.params);

      products.push(...(result.items as PPEProduct[]));

      task.processedCount += result.items.length;
      task.totalCount = result.totalCount;
      task.progress = Math.min(100, (task.processedCount / result.totalCount) * 100);

      this.emit('taskProgress', task);

      hasMore = result.hasNextPage;
      page++;
    }

    return {
      products,
      totalFetched: products.length,
      totalSaved: products.length,
      duration: Date.now() - syncStartTime,
    };
  }

  /**
   * 执行增量同步
   */
  private async runIncrementalSync(
    task: Task,
    parser: PPEParser,
    products: PPEProduct[]
  ): Promise<TaskResult> {
    // 增量同步逻辑（基于最后同步时间）
    const lastSyncTime = task.config.params?.lastSyncTime;

    if (!lastSyncTime) {
      throw new Error('lastSyncTime is required for incremental sync');
    }

    // 这里可以实现基于时间的增量同步逻辑
    // 暂时使用全量同步作为示例
    return this.runFullSync(task, parser, products);
  }

  /**
   * 执行列表获取
   */
  private async runListFetch(
    task: Task,
    parser: PPEParser,
    products: PPEProduct[]
  ): Promise<TaskResult> {
    const startTime = Date.now();
    const page = task.config.params?.page || 1;
    const result = await parser.fetchListPage(page, task.config.params);

    products.push(...(result.items as PPEProduct[]));

    task.processedCount = result.items.length;
    task.totalCount = result.totalCount;
    task.progress = 100;

    return {
      products,
      totalFetched: products.length,
      totalSaved: products.length,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 执行详情获取
   */
  private async runDetailFetch(
    task: Task,
    parser: PPEParser,
    products: PPEProduct[]
  ): Promise<TaskResult> {
    const startTime = Date.now();
    const productId = task.config.params?.productId;

    if (!productId) {
      throw new Error('productId is required for detail fetch');
    }

    const result = await parser.fetchDetailPage(productId);

    if (result.product) {
      products.push(result.product as PPEProduct);
    }

    task.processedCount = 1;
    task.totalCount = 1;
    task.progress = 100;

    return {
      products,
      totalFetched: products.length,
      totalSaved: products.length,
      duration: Date.now() - startTime,
    };
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.on('taskCreated', (task) => {
      console.log(`[${this.name}] Event: taskCreated - ${task.id}`);
    });

    this.on('taskStarted', (task) => {
      console.log(`[${this.name}] Event: taskStarted - ${task.id}`);
    });

    this.on('taskCompleted', (task) => {
      console.log(`[${this.name}] Event: taskCompleted - ${task.id}`);
    });

    this.on('taskFailed', (task, error) => {
      console.error(`[${this.name}] Event: taskFailed - ${task.id}`, error);
    });

    this.on('taskProgress', (task) => {
      console.log(`[${this.name}] Event: taskProgress - ${task.id}: ${task.progress.toFixed(2)}%`);
    });
  }

  /**
   * 启动持久化
   */
  private startPersistence(): void {
    this.persistenceTimer = setInterval(() => {
      this.persistTasks();
    }, this.config.persistenceInterval);
  }

  /**
   * 持久化任务状态
   */
  private persistTasks(): void {
    // 这里可以实现任务状态的持久化逻辑
    // 例如保存到数据库或文件
    console.log(`[${this.name}] Persisting ${this.tasks.size} tasks`);
  }

  /**
   * 生成任务 ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * 创建任务调度器实例
 */
export function createTaskScheduler(config?: Partial<SchedulerConfig>): TaskScheduler {
  return new TaskScheduler(config);
}
