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
import { MonitoringService } from './monitoring.service';
import { CreateMonitorDto, UpdateMonitorDto, MonitorQueryDto, MetricQueryDto, RecordMetricDto } from './dto/monitor.dto';

@ApiTags('monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Post('monitors')
  @ApiOperation({ summary: '创建监控' })
  @ApiResponse({ status: 201, description: '监控创建成功' })
  async create(@Body() createMonitorDto: CreateMonitorDto) {
    return this.monitoringService.create(createMonitorDto);
  }

  @Get('monitors')
  @ApiOperation({ summary: '获取所有监控' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: MonitorQueryDto) {
    return this.monitoringService.findAll(query);
  }

  @Get('monitors/active')
  @ApiOperation({ summary: '获取活跃监控' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getActiveMonitors() {
    return this.monitoringService.getActiveMonitors();
  }

  @Get('monitors/statistics')
  @ApiOperation({ summary: '获取监控统计' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics() {
    return this.monitoringService.getStatistics();
  }

  @Get('monitors/:id')
  @ApiOperation({ summary: '根据 ID 获取监控' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '监控不存在' })
  async findOne(@Param('id') id: string) {
    return this.monitoringService.findOne(id);
  }

  @Get('monitors/:id/trend')
  @ApiOperation({ summary: '获取监控趋势' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '监控不存在' })
  async getTrend(@Param('id') id: string, @Query('limit') limit = 100) {
    return this.monitoringService.getTrend(id, parseInt(limit.toString()));
  }

  @Patch('monitors/:id')
  @ApiOperation({ summary: '更新监控' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '监控不存在' })
  async update(@Param('id') id: string, @Body() updateMonitorDto: UpdateMonitorDto) {
    return this.monitoringService.update(id, updateMonitorDto);
  }

  @Post('monitors/:id/toggle')
  @ApiOperation({ summary: '启用/停用监控' })
  @ApiResponse({ status: 200, description: '操作成功' })
  @ApiResponse({ status: 404, description: '监控不存在' })
  async toggleStatus(@Param('id') id: string) {
    return this.monitoringService.toggleStatus(id);
  }

  @Delete('monitors/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除监控' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '监控不存在' })
  async remove(@Param('id') id: string) {
    await this.monitoringService.remove(id);
  }

  @Post('monitors/:id/check')
  @ApiOperation({ summary: '执行监控检查' })
  @ApiResponse({ status: 200, description: '检查完成' })
  @ApiResponse({ status: 404, description: '监控不存在' })
  async performCheck(@Param('id') id: string) {
    await this.monitoringService.performCheck(id);
    return { message: '监控检查完成' };
  }

  @Post('metrics')
  @ApiOperation({ summary: '记录监控指标' })
  @ApiResponse({ status: 201, description: '指标记录成功' })
  async recordMetric(@Body() recordMetricDto: RecordMetricDto) {
    return this.monitoringService.recordMetric(recordMetricDto);
  }

  @Get('metrics')
  @ApiOperation({ summary: '获取监控指标' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getMetrics(@Query() query: MetricQueryDto) {
    return this.monitoringService.getMetrics(query);
  }

  @Post('cleanup')
  @ApiOperation({ summary: '清理旧指标数据' })
  @ApiResponse({ status: 200, description: '清理完成' })
  async cleanupOldMetrics(@Query('days') days = 30) {
    const count = await this.monitoringService.cleanupOldMetrics(parseInt(days.toString()));
    return { message: `清理了 ${count} 条旧指标数据` };
  }
}
