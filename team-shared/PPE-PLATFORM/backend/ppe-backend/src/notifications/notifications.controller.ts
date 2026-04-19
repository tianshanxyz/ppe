import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';
import {
  SendNotificationDto,
  SendBulkNotificationsDto,
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
  NotificationQueryDto,
  RenderTemplateDto,
} from './dto/notification.dto';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: '发送通知' })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  async sendNotification(@Body() sendNotificationDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendNotificationDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: '批量发送通知' })
  @ApiResponse({ status: 201, description: '批量通知发送成功' })
  async sendBulkNotifications(@Body() sendBulkNotificationsDto: SendBulkNotificationsDto) {
    return this.notificationsService.sendBulkNotifications(sendBulkNotificationsDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有通知' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: NotificationQueryDto) {
    return this.notificationsService.findAll(query);
  }

  @Get('unread/count')
  @ApiOperation({ summary: '获取未读通知数量' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUnreadCount(@Query('userId') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户通知列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getUserNotifications(
    @Param('userId') userId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.notificationsService.getUserNotifications(userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取通知' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记通知为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  @ApiResponse({ status: 404, description: '通知不存在' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('batch/read')
  @ApiOperation({ summary: '批量标记为已读' })
  @ApiResponse({ status: 200, description: '标记成功' })
  async batchMarkAsRead(@Body() body: { ids: string[] }) {
    return this.notificationsService.batchMarkAsRead(body.ids);
  }

  @Get('statistics/overview')
  @ApiOperation({ summary: '获取通知统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.notificationsService.getStatistics();
  }

  @Post('templates')
  @ApiOperation({ summary: '创建通知模板' })
  @ApiResponse({ status: 201, description: '模板创建成功' })
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    return this.notificationsService.createTemplate(createTemplateDto);
  }

  @Get('templates')
  @ApiOperation({ summary: '获取所有模板' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAllTemplates(@Query() query: TemplateQueryDto) {
    return this.notificationsService.findAllTemplates(query);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '根据 ID 获取模板' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async findTemplateById(@Param('id') id: string) {
    return this.notificationsService.findTemplateById(id);
  }

  @Get('templates/name/:name')
  @ApiOperation({ summary: '根据名称获取模板' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async findTemplateByName(@Param('name') name: string) {
    return this.notificationsService.findTemplateByName(name);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: '更新模板' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async updateTemplate(@Param('id') id: string, @Body() updateTemplateDto: UpdateTemplateDto) {
    return this.notificationsService.updateTemplate(id, updateTemplateDto);
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除模板' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async deleteTemplate(@Param('id') id: string) {
    await this.notificationsService.deleteTemplate(id);
  }

  @Post('templates/:id/render')
  @ApiOperation({ summary: '渲染模板' })
  @ApiResponse({ status: 200, description: '渲染成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async renderTemplate(@Param('id') id: string, @Body() renderTemplateDto: RenderTemplateDto) {
    return this.notificationsService.renderTemplate(id, renderTemplateDto.data);
  }

  @Post('templates/:id/send')
  @ApiOperation({ summary: '使用模板发送通知' })
  @ApiResponse({ status: 201, description: '通知发送成功' })
  @ApiResponse({ status: 404, description: '模板不存在' })
  async sendWithTemplate(
    @Param('id') id: string,
    @Body() body: { recipient: string; data: Record<string, any>; userId?: string },
  ) {
    return this.notificationsService.sendWithTemplate(id, body.recipient, body.data, body.userId);
  }
}
