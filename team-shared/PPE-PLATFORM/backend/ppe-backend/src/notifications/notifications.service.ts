import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Notification, NotificationType, NotificationStatus, NotificationPriority } from './notification.entity';
import { NotificationTemplate, TemplateType, TemplateStatus } from './notification-template.entity';
import {
  SendNotificationDto,
  SendBulkNotificationsDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
  NotificationQueryDto,
  RenderTemplateDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepository: Repository<NotificationTemplate>,
  ) {}

  /**
   * 发送通知
   */
  async sendNotification(dto: SendNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...dto,
      status: NotificationStatus.PENDING,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    this.logger.log(`通知已创建：${savedNotification.id}, 类型：${savedNotification.type}`);

    // 异步发送通知
    this.processNotification(savedNotification).catch((error) => {
      this.logger.error(`通知发送失败：${savedNotification.id}`, error);
    });

    return savedNotification;
  }

  /**
   * 批量发送通知
   */
  async sendBulkNotifications(dto: SendBulkNotificationsDto): Promise<Notification[]> {
    const notifications = dto.notifications.map((notif) =>
      this.notificationRepository.create({
        ...notif,
        status: NotificationStatus.PENDING,
      }),
    );

    const savedNotifications = await this.notificationRepository.save(notifications);
    this.logger.log(`批量通知已创建：${savedNotifications.length} 条`);

    // 异步发送
    savedNotifications.forEach((notification) => {
      this.processNotification(notification).catch((error) => {
        this.logger.error(`通知发送失败：${notification.id}`, error);
      });
    });

    return savedNotifications;
  }

  /**
   * 处理通知发送
   */
  private async processNotification(notification: Notification): Promise<void> {
    try {
      notification.status = NotificationStatus.SENDING;
      await this.notificationRepository.save(notification);

      switch (notification.type) {
        case NotificationType.EMAIL:
          await this.sendEmail(notification);
          break;
        case NotificationType.IN_APP:
          await this.sendInApp(notification);
          break;
        case NotificationType.WEBHOOK:
          await this.sendWebhook(notification);
          break;
        case NotificationType.SMS:
          await this.sendSms(notification);
          break;
        default:
          throw new Error(`不支持的通知类型：${notification.type}`);
      }

      notification.status = NotificationStatus.SENT;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);
      this.logger.log(`通知发送成功：${notification.id}`);
    } catch (error) {
      this.logger.error(`通知发送失败：${notification.id}`, error);
      notification.status = NotificationStatus.FAILED;
      notification.failedReason = error.message;
      notification.retryCount += 1;

      // 如果重试次数小于 3 次，可以重新尝试
      if (notification.retryCount < 3) {
        this.logger.log(`通知将重试，当前重试次数：${notification.retryCount}`);
      }

      await this.notificationRepository.save(notification);
    }
  }

  /**
   * 发送邮件通知
   */
  private async sendEmail(notification: Notification): Promise<void> {
    // TODO: 集成邮件发送服务
    this.logger.log(`发送邮件通知到：${notification.recipient || notification.userId}`);
    this.logger.log(`主题：${notification.subject}`);
    this.logger.log(`内容：${notification.content}`);
    
    // 模拟发送延迟
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * 发送站内信
   */
  private async sendInApp(notification: Notification): Promise<void> {
    // TODO: 集成 WebSocket 推送
    this.logger.log(`发送站内信给用户：${notification.userId}`);
    this.logger.log(`内容：${notification.content}`);
    
    // 模拟发送延迟
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  /**
   * 发送 Webhook
   */
  private async sendWebhook(notification: Notification): Promise<void> {
    if (!notification.recipient) {
      throw new Error('Webhook URL 不能为空');
    }

    this.logger.log(`发送 Webhook 到：${notification.recipient}`);
    this.logger.log(`内容：${notification.content}`);

    // TODO: 实际发送 HTTP 请求
    // await fetch(notification.recipient, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     subject: notification.subject,
    //     content: notification.content,
    //     metadata: notification.metadata,
    //   }),
    // });

    // 模拟发送延迟
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  /**
   * 发送短信
   */
  private async sendSms(notification: Notification): Promise<void> {
    if (!notification.recipient) {
      throw new Error('手机号不能为空');
    }

    this.logger.log(`发送短信到：${notification.recipient}`);
    this.logger.log(`内容：${notification.content}`);

    // TODO: 集成短信服务
    // 模拟发送延迟
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  /**
   * 获取所有通知
   */
  async findAll(query: NotificationQueryDto): Promise<{ notifications: Notification[]; total: number }> {
    const { userId, type, status, priority, page = 1, limit = 20 } = query;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where(where)
      .orderBy('notification.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return { notifications, total };
  }

  /**
   * 根据 ID 获取通知
   */
  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });

    if (!notification) {
      throw new NotFoundException('通知不存在');
    }

    return notification;
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.findOne(id);
    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  /**
   * 批量标记为已读
   */
  async batchMarkAsRead(ids: string[]): Promise<number> {
    const result = await this.notificationRepository
      .createQueryBuilder()
      .update()
      .set({
        status: NotificationStatus.READ,
        readAt: new Date(),
      })
      .where('id IN (:...ids)', { ids })
      .execute();

    return result.affected || 0;
  }

  /**
   * 获取用户未读通知数量
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        userId,
        status: NotificationStatus.SENT,
      },
    });
  }

  /**
   * 获取用户通知列表
   */
  async getUserNotifications(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ notifications: Notification[]; total: number }> {
    return this.findAll({ userId, page, limit });
  }

  /**
   * 创建模板
   */
  async createTemplate(dto: CreateTemplateDto): Promise<NotificationTemplate> {
    const template = this.templateRepository.create(dto);
    return this.templateRepository.save(template);
  }

  /**
   * 获取所有模板
   */
  async findAllTemplates(query: TemplateQueryDto): Promise<{ templates: NotificationTemplate[]; total: number }> {
    const { name, type, status, page = 1, limit = 10 } = query;

    const where: any = {};

    if (name) {
      where.name = ILike(`%${name}%`);
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const queryBuilder = this.templateRepository
      .createQueryBuilder('template')
      .where(where)
      .orderBy('template.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [templates, total] = await queryBuilder.getManyAndCount();

    return { templates, total };
  }

  /**
   * 根据 ID 获取模板
   */
  async findTemplateById(id: string): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { id } });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    return template;
  }

  /**
   * 根据名称获取模板
   */
  async findTemplateByName(name: string): Promise<NotificationTemplate> {
    const template = await this.templateRepository.findOne({ where: { name } });

    if (!template) {
      throw new NotFoundException('模板不存在');
    }

    return template;
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, dto: UpdateTemplateDto): Promise<NotificationTemplate> {
    const template = await this.findTemplateById(id);
    Object.assign(template, dto);
    return this.templateRepository.save(template);
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = await this.findTemplateById(id);
    await this.templateRepository.remove(template);
  }

  /**
   * 渲染模板
   */
  async renderTemplate(templateId: string, data: Record<string, any>): Promise<{ subject: string; content: string; htmlContent?: string }> {
    const template = await this.findTemplateById(templateId);

    let subject = template.subject;
    let content = template.content;
    let htmlContent = template.htmlContent;

    // 简单的模板变量替换
    Object.keys(data).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      subject = subject.replace(regex, data[key]);
      content = content.replace(regex, data[key]);
      if (htmlContent) {
        htmlContent = htmlContent.replace(regex, data[key]);
      }
    });

    return { subject, content, htmlContent };
  }

  /**
   * 使用模板发送通知
   */
  async sendWithTemplate(
    templateId: string,
    recipient: string,
    data: Record<string, any>,
    userId?: string,
  ): Promise<Notification> {
    const { subject, content, htmlContent } = await this.renderTemplate(templateId, data);

    const notification = this.notificationRepository.create({
      userId,
      recipient,
      type: NotificationType.EMAIL, // 默认邮件
      subject,
      content,
      htmlContent,
      templateId,
      templateData: data,
      status: NotificationStatus.PENDING,
    });

    const savedNotification = await this.notificationRepository.save(notification);
    
    // 异步发送
    this.processNotification(savedNotification).catch((error) => {
      this.logger.error(`通知发送失败：${savedNotification.id}`, error);
    });

    return savedNotification;
  }

  /**
   * 获取通知统计
   */
  async getStatistics(): Promise<any> {
    const queryBuilder = this.notificationRepository.createQueryBuilder('notification');

    const totalQuery = await queryBuilder.getCount();

    const byTypeQuery = await queryBuilder
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .getRawMany();

    const byType = byTypeQuery.reduce((acc, item) => {
      acc[item.type] = parseInt(item.count);
      return acc;
    }, {});

    const byStatusQuery = await queryBuilder
      .select('notification.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.status')
      .getRawMany();

    const byStatus = byStatusQuery.reduce((acc, item) => {
      acc[item.status] = parseInt(item.count);
      return acc;
    }, {});

    const byPriorityQuery = await queryBuilder
      .select('notification.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.priority')
      .getRawMany();

    const byPriority = byPriorityQuery.reduce((acc, item) => {
      acc[item.priority] = parseInt(item.count);
      return acc;
    }, {});

    const sentCount = await queryBuilder
      .where('notification.status = :status', { status: NotificationStatus.SENT })
      .getCount();

    const failedCount = await queryBuilder
      .where('notification.status = :status', { status: NotificationStatus.FAILED })
      .getCount();

    const pendingCount = await queryBuilder
      .where('notification.status = :status', { status: NotificationStatus.PENDING })
      .getCount();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await queryBuilder
      .where('notification.createdAt >= :today', { today })
      .getCount();

    return {
      totalNotifications: totalQuery,
      byType,
      byStatus,
      byPriority,
      sentCount,
      failedCount,
      pendingCount,
      todayCount,
    };
  }

  /**
   * 删除旧通知（数据清理）
   */
  async deleteOldNotifications(daysToKeep = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.notificationRepository
      .createQueryBuilder('notification')
      .delete()
      .where('notification.createdAt < :cutoffDate', { cutoffDate })
      .andWhere('notification.status IN (:...statuses)', {
        statuses: [NotificationStatus.SENT, NotificationStatus.FAILED, NotificationStatus.READ],
      })
      .execute();

    this.logger.log(`删除了 ${result.affected || 0} 条旧通知`);
    return result.affected || 0;
  }
}
