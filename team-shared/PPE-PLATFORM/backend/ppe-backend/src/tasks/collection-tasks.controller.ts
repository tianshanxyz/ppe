import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollectionTasksService } from './collection-tasks.service';
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateTaskStatusDto,
  TaskQueryDto,
} from './dto/task.dto';

@ApiTags('tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CollectionTasksController {
  constructor(private readonly tasksService: CollectionTasksService) {}

  @Post()
  @ApiOperation({ summary: '创建采集任务' })
  @ApiResponse({ status: 201, description: '任务创建成功' })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createTask(@Request() req, @Body() createTaskDto: CreateTaskDto) {
    return this.tasksService.createTask(createTaskDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: '获取任务列表' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async findAll(@Query() query: TaskQueryDto) {
    return this.tasksService.findAll(query);
  }

  @Get('statistics')
  @ApiOperation({ summary: '获取任务统计信息' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getStatistics(@Request() req, @Query('createdById') createdById?: string) {
    // 默认查询当前用户的统计，如果有 createdById 参数则查询指定用户
    const userId = createdById || req.user.userId;
    return this.tasksService.getTaskStatistics(userId);
  }

  @Get('pending')
  @ApiOperation({ summary: '获取待处理任务' })
  @ApiResponse({ status: 200, description: '查询成功' })
  async getPendingTasks(@Query('limit') limit: number = 10) {
    return this.tasksService.getPendingTasks(limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '根据 ID 获取任务' })
  @ApiResponse({ status: 200, description: '查询成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新任务' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '无权更新' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async update(@Request() req, @Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.tasksService.update(id, updateTaskDto, req.user.userId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新任务状态' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '任务不存在' })
  async updateTaskStatus(
    @Param('id') id: string,
    @Body() updateTaskStatusDto: UpdateTaskStatusDto,
  ) {
    return this.tasksService.updateTaskStatus(id, updateTaskStatusDto);
  }

  @Post(':id/start')
  @ApiOperation({ summary: '启动任务' })
  @ApiResponse({ status: 200, description: '启动成功' })
  @ApiResponse({ status: 400, description: '任务状态不允许启动' })
  async startTask(@Param('id') id: string) {
    return this.tasksService.startTask(id);
  }

  @Post(':id/pause')
  @ApiOperation({ summary: '暂停任务' })
  @ApiResponse({ status: 200, description: '暂停成功' })
  @ApiResponse({ status: 400, description: '任务状态不允许暂停' })
  async pauseTask(@Param('id') id: string) {
    return this.tasksService.pauseTask(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: '取消任务' })
  @ApiResponse({ status: 200, description: '取消成功' })
  @ApiResponse({ status: 400, description: '任务状态不允许取消' })
  async cancelTask(@Param('id') id: string) {
    return this.tasksService.cancelTask(id);
  }

  @Post(':id/retry')
  @ApiOperation({ summary: '重试任务' })
  @ApiResponse({ status: 200, description: '重试成功' })
  @ApiResponse({ status: 400, description: '不能重试此状态的任务' })
  async retryTask(@Param('id') id: string) {
    return this.tasksService.retryTask(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除任务' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 403, description: '无权删除' })
  @ApiResponse({ status: 400, description: '不能删除运行中的任务' })
  async remove(@Request() req, @Param('id') id: string) {
    await this.tasksService.remove(id, req.user.userId);
  }
}
