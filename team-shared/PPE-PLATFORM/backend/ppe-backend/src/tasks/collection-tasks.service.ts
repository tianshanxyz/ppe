import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { CollectionTask, TaskStatus, TaskPriority } from './collection-task.entity';
import { CreateTaskDto, UpdateTaskDto, UpdateTaskStatusDto, TaskQueryDto } from './dto/task.dto';

@Injectable()
export class CollectionTasksService {
  constructor(
    @InjectRepository(CollectionTask)
    private readonly taskRepository: Repository<CollectionTask>,
  ) {}

  /**
   * 创建采集任务
   */
  async createTask(createTaskDto: CreateTaskDto, userId: string): Promise<CollectionTask> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      status: TaskStatus.PENDING,
      createdById: userId,
      progress: 0,
      retryCount: 0,
    });

    return this.taskRepository.save(task);
  }

  /**
   * 获取所有任务（支持分页和筛选）
   */
  async findAll(query: TaskQueryDto): Promise<{ tasks: CollectionTask[]; total: number }> {
    const {
      name,
      type,
      status,
      priority,
      createdById,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.updatedBy', 'updatedBy')
      .where('task.isActive = :isActive', { isActive: true });

    // 筛选条件
    if (name) {
      queryBuilder.andWhere('task.name ILIKE :name', { name: `%${name}%` });
    }

    if (type) {
      queryBuilder.andWhere('task.type = :type', { type });
    }

    if (status) {
      queryBuilder.andWhere('task.status = :status', { status });
    }

    if (priority) {
      queryBuilder.andWhere('task.priority = :priority', { priority });
    }

    if (createdById) {
      queryBuilder.andWhere('task.createdById = :createdById', { createdById });
    }

    // 排序
    queryBuilder.orderBy(`task.${sortBy}`, sortOrder);

    // 分页
    queryBuilder.skip((page - 1) * limit).take(limit);

    const [tasks, total] = await queryBuilder.getManyAndCount();

    return {
      tasks,
      total,
    };
  }

  /**
   * 根据 ID 获取任务
   */
  async findOne(id: string): Promise<CollectionTask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'updatedBy'],
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }

    return task;
  }

  /**
   * 更新任务
   */
  async update(id: string, updateTaskDto: UpdateTaskDto, userId: string): Promise<CollectionTask> {
    const task = await this.findOne(id);

    // 检查权限：只有创建者或管理员可以更新
    if (task.createdById !== userId) {
      // 这里应该检查用户是否为 admin，简化处理
      throw new ForbiddenException('无权更新此任务');
    }

    // 运行中的任务不能更新某些字段
    if (task.status === TaskStatus.RUNNING) {
      const restrictedFields = ['sourceUrl', 'targetResource', 'type'];
      for (const field of restrictedFields) {
        if (updateTaskDto[field]) {
          throw new BadRequestException(`任务运行中不能修改${field}字段`);
        }
      }
    }

    Object.assign(task, updateTaskDto);
    task.updatedById = userId;

    return this.taskRepository.save(task);
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(
    id: string,
    updateTaskStatusDto: UpdateTaskStatusDto,
  ): Promise<CollectionTask> {
    const task = await this.findOne(id);

    const { status, errorMessage, result, progress, processedItems, totalItems } =
      updateTaskStatusDto;

    task.status = status;
    task.errorMessage = errorMessage || task.errorMessage;
    task.result = result || task.result;
    task.progress = progress !== undefined ? progress : task.progress;
    task.processedItems = processedItems !== undefined ? processedItems : task.processedItems;
    task.totalItems = totalItems !== undefined ? totalItems : task.totalItems;

    // 设置开始时间
    if (status === TaskStatus.RUNNING && !task.startedAt) {
      task.startedAt = new Date();
    }

    // 设置完成时间
    if (
      [TaskStatus.COMPLETED, TaskStatus.FAILED, TaskStatus.CANCELLED].includes(status) &&
      !task.completedAt
    ) {
      task.completedAt = new Date();
    }

    return this.taskRepository.save(task);
  }

  /**
   * 启动任务
   */
  async startTask(id: string): Promise<CollectionTask> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException('只有待处理的任务才能启动');
    }

    return this.updateTaskStatus(id, { status: TaskStatus.RUNNING });
  }

  /**
   * 暂停任务
   */
  async pauseTask(id: string): Promise<CollectionTask> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.RUNNING) {
      throw new BadRequestException('只有运行中的任务才能暂停');
    }

    // 暂停任务实际上是将其状态改回 PENDING
    return this.updateTaskStatus(id, { status: TaskStatus.PENDING });
  }

  /**
   * 取消任务
   */
  async cancelTask(id: string): Promise<CollectionTask> {
    const task = await this.findOne(id);

    if (
      ![TaskStatus.PENDING, TaskStatus.RUNNING].includes(task.status)
    ) {
      throw new BadRequestException('只能取消待处理或运行中的任务');
    }

    return this.updateTaskStatus(id, { status: TaskStatus.CANCELLED });
  }

  /**
   * 重试失败的任务
   */
  async retryTask(id: string): Promise<CollectionTask> {
    const task = await this.findOne(id);

    if (task.status !== TaskStatus.FAILED) {
      throw new BadRequestException('只能重试失败的任务');
    }

    if (task.retryCount >= task.maxRetries) {
      throw new BadRequestException('已达到最大重试次数');
    }

    task.status = TaskStatus.PENDING;
    task.retryCount += 1;
    task.errorMessage = null;
    task.startedAt = null;
    task.completedAt = null;
    task.progress = 0;
    task.processedItems = 0;

    return this.taskRepository.save(task);
  }

  /**
   * 删除任务（软删除）
   */
  async remove(id: string, userId: string): Promise<void> {
    const task = await this.findOne(id);

    // 检查权限
    if (task.createdById !== userId) {
      throw new ForbiddenException('无权删除此任务');
    }

    // 运行中的任务不能删除
    if (task.status === TaskStatus.RUNNING) {
      throw new BadRequestException('不能删除运行中的任务');
    }

    task.isActive = false;
    task.updatedById = userId;
    await this.taskRepository.save(task);
  }

  /**
   * 获取任务统计信息
   */
  async getTaskStatistics(createdById?: string): Promise<any> {
    const queryBuilder = this.taskRepository
      .createQueryBuilder('task')
      .where('task.isActive = :isActive', { isActive: true });

    if (createdById) {
      queryBuilder.andWhere('task.createdById = :createdById', { createdById });
    }

    const total = await queryBuilder.getCount();

    const statusCount = await queryBuilder
      .clone()
      .select('task.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.status')
      .getRawMany();

    const typeCount = await queryBuilder
      .clone()
      .select('task.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.type')
      .getRawMany();

    const priorityCount = await queryBuilder
      .clone()
      .select('task.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('task.priority')
      .getRawMany();

    const runningTasks = await queryBuilder
      .clone()
      .andWhere('task.status = :status', { status: TaskStatus.RUNNING })
      .getMany();

    const avgProgress = runningTasks.length > 0
      ? runningTasks.reduce((sum, task) => sum + task.progress, 0) / runningTasks.length
      : 0;

    return {
      total,
      statusCount: statusCount.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      typeCount: typeCount.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      priorityCount: priorityCount.reduce((acc, item) => {
        acc[item.priority] = parseInt(item.count);
        return acc;
      }, {}),
      runningTasks: runningTasks.length,
      avgProgress: Math.round(avgProgress),
    };
  }

  /**
   * 获取待处理任务（按优先级排序）
   */
  async getPendingTasks(limit: number = 10): Promise<CollectionTask[]> {
    return this.taskRepository.find({
      where: {
        status: TaskStatus.PENDING,
        isActive: true,
      },
      order: {
        priority: 'DESC',
        createdAt: 'ASC',
      },
      take: limit,
    });
  }
}
