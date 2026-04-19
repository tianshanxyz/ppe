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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AlertsService } from './alerts.service';
import { CreateAlertRuleDto, UpdateAlertRuleDto, AlertRuleQueryDto, AlertRecordQueryDto, ProcessAlertDto } from './dto/alert.dto';
import { AlertLevel, AlertType, AlertStatus } from './alert-rule.entity';

@ApiTags('alerts')
@Controller('alerts')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post('rules')
  @ApiOperation({ summary: '创建告警规则' })
  @ApiResponse({ status: 201, description: '规则创建成功' })
  @ApiResponse({ status: 409, description: '规则名称已存在' })
  async create(@Body() createAlertRuleDto: CreateAlertRuleDto) {
    return this.alertsService.create(createAlertRuleDto);
  }

  @Get('rules')
  @ApiOperation({ summary: '获取所有告警规则' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: AlertRuleQueryDto) {
    return this.alertsService.findAll(query);
  }

  @Get('rules/active')
  @ApiOperation({ summary: '获取活跃告警规则' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getActiveRules() {
    return this.alertsService.getActiveRules();
  }

  @Get('rules/:id')
  @ApiOperation({ summary: '根据 ID 获取告警规则' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  @Patch('rules/:id')
  @ApiOperation({ summary: '更新告警规则' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  @ApiResponse({ status: 409, description: '规则名称已存在' })
  async update(@Param('id') id: string, @Body() updateAlertRuleDto: UpdateAlertRuleDto) {
    return this.alertsService.update(id, updateAlertRuleDto);
  }

  @Delete('rules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除告警规则' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async remove(@Param('id') id: string) {
    await this.alertsService.remove(id);
  }

  @Post('rules/:id/toggle')
  @ApiOperation({ summary: '启用/禁用告警规则' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async toggleStatus(@Param('id') id: string) {
    return this.alertsService.toggleStatus(id);
  }

  @Post('rules/:id/trigger')
  @ApiOperation({ summary: '手动触发告警' })
  @ApiResponse({ status: 201, description: '告警触发成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  @ApiResponse({ status: 409, description: '规则已禁用' })
  async triggerAlert(
    @Param('id') id: string,
    @Body() body: { title: string; message: string; triggerData?: any; triggerValue?: number; affectedRecords?: string[] },
  ) {
    return this.alertsService.triggerAlert(
      id,
      body.title,
      body.message,
      body.triggerData,
      body.triggerValue,
      body.affectedRecords,
    );
  }

  @Post('rules/:id/evaluate')
  @ApiOperation({ summary: '评估规则' })
  @ApiResponse({ status: 200, description: '评估成功' })
  @ApiResponse({ status: 404, description: '规则不存在' })
  async evaluateRule(
    @Param('id') id: string,
    @Body() body: { currentValue: any },
  ) {
    return this.alertsService.evaluateRule(id, body.currentValue);
  }

  @Get('records')
  @ApiOperation({ summary: '获取告警记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getAlertRecords(@Query() query: AlertRecordQueryDto) {
    return this.alertsService.getAlertRecords(query);
  }

  @Get('records/pending/count')
  @ApiOperation({ summary: '获取未处理告警数量' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getPendingCount(@Query('ruleId') ruleId?: string) {
    return this.alertsService.getPendingCount(ruleId);
  }

  @Get('records/statistics')
  @ApiOperation({ summary: '获取告警统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.alertsService.getStatistics();
  }

  @Get('records/:id')
  @ApiOperation({ summary: '根据 ID 获取告警记录' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async getRecord(@Param('id') id: string) {
    const records = await this.alertsService.getAlertRecords({ ruleId: id });
    if (records.records.length === 0) {
      throw new Error('记录不存在');
    }
    return records.records[0];
  }

  @Patch('records/:id/process')
  @ApiOperation({ summary: '处理告警' })
  @ApiResponse({ status: 200, description: '处理成功' })
  @ApiResponse({ status: 404, description: '记录不存在' })
  async processAlert(
    @Param('id') id: string,
    @Body() processAlertDto: ProcessAlertDto,
  ) {
    return this.alertsService.processAlert(id, processAlertDto);
  }

  @Post('records/batch-process')
  @ApiOperation({ summary: '批量处理告警' })
  @ApiResponse({ status: 200, description: '处理成功' })
  async batchProcessAlerts(
    @Body() body: { ids: string[]; status: string; resolution: string },
  ) {
    return this.alertsService.batchProcessAlerts(body.ids, body.status, body.resolution);
  }
}
